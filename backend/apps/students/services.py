from django.db.models import Q, QuerySet

from apps.authorization.models import UserRole


def scope_students_for_teacher(queryset: QuerySet, user) -> QuerySet:
    """A Teacher must never browse the whole school's student roster — every `/students/`
    consumer (this app's own list/detail, and every other feature's "pick a student" selector
    that reads through the same endpoint: subject rosters, messaging, attendance, lessons, ...)
    should only ever offer students actually admitted to a class this teacher is assigned to
    teach. Scoping once here, at the shared queryset, means every one of those call sites gets
    this for free rather than each needing its own copy of the same filter.

    Keyed off the "teacher" role slug specifically, not the `students.view`-only permission —
    Accountant and Exams Director also hold view-only student access but legitimately need
    school-wide visibility (fees, exam results), since neither of them "teaches" a class at all.
    `unscoped_objects`/an explicit `user=` filter throughout, the same pattern used in
    `CurrentUserSerializer`, so this is correct regardless of which request-scoped tenant context
    happens to be live when it runs.
    """
    from apps.academics.models import Section, SchoolClass

    is_teacher = UserRole.unscoped_objects.filter(user=user, role__slug="teacher").exists()
    if not is_teacher:
        return queryset

    staff_profile = getattr(user, "staff_profile", None)
    if staff_profile is None:
        return queryset.none()

    class_ids = set(
        SchoolClass.unscoped_objects.filter(
            Q(subject_offerings__main_teacher=staff_profile) | Q(subject_offerings__assistant_teacher=staff_profile)
        ).values_list("id", flat=True)
    )
    class_ids |= set(
        Section.unscoped_objects.filter(class_teacher=staff_profile).values_list("school_class_id", flat=True)
    )
    return queryset.filter(current_class_id__in=class_ids)
