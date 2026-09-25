from django.utils import timezone

from apps.notifications.services import notify_bulk

from .models import Event, EventRecipient


def resolve_recipients(event: Event):
    """Same shape as `apps.communications.services.resolve_recipients` — every branch filters by
    `event.school` explicitly and uses `unscoped_objects` throughout (this can run outside request
    context, e.g. from a management command later), not `objects`."""
    from apps.parents.models import Guardian, StudentGuardian
    from apps.students.models import Student
    from apps.users.models import User

    school = event.school
    target = event.target_type
    Target = Event.TargetType

    if target == Target.SCHOOL:
        return list(User.objects.filter(school=school, is_active=True))

    if target == Target.STAFF:
        qs = User.objects.filter(school=school, is_active=True, staff_profile__isnull=False)
        if event.target_department_id:
            qs = qs.filter(staff_profile__department_id=event.target_department_id)
        return list(qs)

    if target == Target.DEPARTMENT:
        return list(
            User.objects.filter(
                school=school, is_active=True, staff_profile__department_id=event.target_department_id
            )
        )

    if target in (Target.STUDENTS, Target.CLASS, Target.SECTION):
        student_qs = Student.unscoped_objects.filter(school=school, user__isnull=False)
        if target == Target.CLASS or event.target_class_id:
            student_qs = student_qs.filter(current_class_id=event.target_class_id)
        if target == Target.SECTION or event.target_section_id:
            student_qs = student_qs.filter(current_section_id=event.target_section_id)
        user_ids = student_qs.values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    if target == Target.PARENTS:
        student_qs = Student.unscoped_objects.filter(school=school)
        if event.target_class_id:
            student_qs = student_qs.filter(current_class_id=event.target_class_id)
        if event.target_section_id:
            student_qs = student_qs.filter(current_section_id=event.target_section_id)
        guardian_ids = StudentGuardian.unscoped_objects.filter(
            school=school, student__in=student_qs
        ).values_list("guardian_id", flat=True)
        user_ids = Guardian.unscoped_objects.filter(
            school=school, id__in=guardian_ids, user__isnull=False
        ).values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    if target == Target.SPECIFIC_USERS:
        user_ids = EventRecipient.unscoped_objects.filter(
            school=school, event=event
        ).values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    return []


def publish_event(event: Event) -> int:
    """Resolves the audience and notifies each recipient in-app. Returns the recipient count."""
    recipients = resolve_recipients(event)

    notify_bulk(
        recipients=recipients,
        category="event",
        title=event.title,
        message=f"{event.title} — {event.start_datetime:%b %d, %Y %H:%M}",
        link=f"/events/{event.id}",
        priority="normal",
    )

    event.status = Event.Status.PUBLISHED
    event.save(update_fields=["status", "updated_at"])
    return len(recipients)
