from django.db.models import Q, QuerySet

import re

from apps.authorization.models import UserRole


def student_default_email(student, *, taken=lambda email: False) -> str:
    """Initials of the first, middle (if any) and last names + "@" + the school's short domain:
    "Fatmata Sia Kamara" at Government Secondary School Kenema -> "fsk@gssk.edu.sl". Initials
    collide constantly, so a number is appended (fsk2, fsk3, ...) until the address is free."""
    school = student.school
    initials = "".join(name[0] for name in (student.first_name, student.middle_name, student.last_name) if name)
    school_code = "".join(word[0] for word in re.findall(r"[A-Za-z0-9]+", school.name)).lower()
    local = re.sub(r"[^a-z0-9]", "", initials.lower()) or "student"
    domain = f"{school_code}.edu.sl"
    candidate, counter = f"{local}@{domain}", 1
    while taken(candidate):
        counter += 1
        candidate = f"{local}{counter}@{domain}"
    return candidate


def provision_student_account(student):
    """Gives a student without a login one: default email (see student_default_email) and the
    school's default password (e.g. "GSSK@2026"), flagged so they must choose their own at first
    sign-in. No email is sent — the address is a school-issued one, not a real inbox. Returns the
    new user, or None if the student already has one."""
    from apps.tenants.services import generate_default_password
    from apps.users.models import User

    if student.user_id:
        return None
    email = student_default_email(student, taken=lambda e: User.objects.filter(email__iexact=e).exists())
    user = User.objects.create(
        email=email,
        first_name=student.first_name,
        last_name=student.last_name,
        school=student.school,
        user_type=User.UserType.SCHOOL_USER,
        is_active=True,
    )
    user.set_password(generate_default_password(student.school))
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])
    student.user = user
    student.save(update_fields=["user"])
    return user



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
