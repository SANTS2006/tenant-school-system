from django.utils import timezone

from apps.notifications.services import notify_bulk

from .models import Announcement, AnnouncementRecipient


def resolve_recipients(announcement: Announcement):
    """
    Every branch filters by `announcement.school` explicitly — targeting
    must remain tenant-scoped no matter how it's sliced (spec's explicit
    requirement). Uses `unscoped_objects` throughout (with that explicit
    school filter as the real scoping), not `objects`, since this can be
    called from a request-scoped view *or* directly (tests, future
    management commands) — see the Phase 9/10 "outside request context"
    rule: `objects` on a TenantScopedModel silently returns nothing without
    ambient tenant context, so relying on it here would work in the view
    and quietly break everywhere else.
    """
    from apps.parents.models import Guardian, StudentGuardian
    from apps.students.models import Student
    from apps.users.models import User

    school = announcement.school
    target = announcement.target_type
    Target = Announcement.TargetType

    if target == Target.SCHOOL:
        return list(User.objects.filter(school=school, is_active=True))

    if target == Target.STAFF:
        qs = User.objects.filter(school=school, is_active=True, staff_profile__isnull=False)
        if announcement.target_department_id:
            qs = qs.filter(staff_profile__department_id=announcement.target_department_id)
        return list(qs)

    if target == Target.DEPARTMENT:
        return list(
            User.objects.filter(
                school=school, is_active=True, staff_profile__department_id=announcement.target_department_id
            )
        )

    if target in (Target.STUDENTS, Target.CLASS, Target.SECTION):
        student_qs = Student.unscoped_objects.filter(school=school, user__isnull=False)
        if target == Target.CLASS or announcement.target_class_id:
            student_qs = student_qs.filter(current_class_id=announcement.target_class_id)
        if target == Target.SECTION or announcement.target_section_id:
            student_qs = student_qs.filter(current_section_id=announcement.target_section_id)
        user_ids = student_qs.values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    if target == Target.PARENTS:
        student_qs = Student.unscoped_objects.filter(school=school)
        if announcement.target_class_id:
            student_qs = student_qs.filter(current_class_id=announcement.target_class_id)
        if announcement.target_section_id:
            student_qs = student_qs.filter(current_section_id=announcement.target_section_id)
        guardian_ids = StudentGuardian.unscoped_objects.filter(
            school=school, student__in=student_qs
        ).values_list("guardian_id", flat=True)
        user_ids = Guardian.unscoped_objects.filter(
            school=school, id__in=guardian_ids, user__isnull=False
        ).values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    if target == Target.SPECIFIC_USERS:
        user_ids = AnnouncementRecipient.unscoped_objects.filter(
            school=school, announcement=announcement
        ).values_list("user_id", flat=True)
        return list(User.objects.filter(id__in=user_ids, is_active=True))

    return []


def publish_announcement(announcement: Announcement) -> int:
    """Resolves the audience, creates one Notification per recipient, and — only if
    the announcement opted in — emails each recipient too. Returns the recipient count."""
    recipients = resolve_recipients(announcement)

    notify_bulk(
        recipients=recipients,
        category="announcement",
        title=announcement.title,
        message=announcement.body[:500],
        link=f"/announcements/{announcement.id}",
        priority="normal",
    )

    if announcement.send_email:
        from apps.common.email import send_email

        for user in recipients:
            if user.email:
                send_email(
                    to_email=user.email,
                    to_name=user.full_name,
                    subject=announcement.title,
                    html_content=f"<p>{announcement.body}</p>",
                )

    announcement.published_at = timezone.now()
    announcement.save(update_fields=["published_at", "updated_at"])
    return len(recipients)
