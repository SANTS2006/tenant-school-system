from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.audit.services import log_action
from apps.authorization.services import assign_role
from apps.tenants.services import generate_default_password

from .emails import (
    send_application_accepted_staff_email,
    send_application_accepted_student_email,
    send_application_rejected_email,
    send_interview_invite_email,
)
from .models import Application, ApplicationDocument


class ApplicationAcceptError(Exception):
    """Raised when one application in a bulk-accept batch can't be accepted as submitted (missing
    a required applied-for class/role, or its email collides with an existing account) — the
    caller (ApplicationViewSet.bulk_accept) catches this per-application and keeps processing the
    rest of the batch, the same skip-and-report shape as
    apps.finance.services.generate_invoices_from_structure."""


def submit_application(*, school, kind, documents=None, **fields) -> Application:
    """The public, unauthenticated entry point — `school` is resolved explicitly by the view (see
    PublicApplyView), never read off a request.user, since there isn't one."""
    application = Application.objects.create(school=school, kind=kind, **fields)
    for upload in documents or []:
        ApplicationDocument.objects.create(
            school=school, application=application, title=upload.name, file=upload
        )
    return application


def shortlist_applications(application_ids, *, school):
    applications = list(Application.unscoped_objects.filter(school=school, pk__in=application_ids))
    for application in applications:
        application.status = Application.Status.SHORTLISTED
        application.save(update_fields=["status"])
    return applications


def invite_applications_to_interview(application_ids, *, school, interview_datetime, location, notes, request=None):
    applications = list(Application.unscoped_objects.filter(school=school, pk__in=application_ids))
    for application in applications:
        application.interview_datetime = interview_datetime
        application.interview_location = location
        application.interview_notes = notes
        application.status = Application.Status.INTERVIEW_SCHEDULED
        application.save(
            update_fields=["interview_datetime", "interview_location", "interview_notes", "status"]
        )
        send_interview_invite_email(application=application, request=request)
    return applications


def reject_applications(application_ids, *, school, reason, actor):
    applications = list(Application.unscoped_objects.filter(school=school, pk__in=application_ids))
    for application in applications:
        application.status = Application.Status.REJECTED
        application.rejection_reason = reason
        application.reviewed_by = actor
        application.decided_at = timezone.now()
        application.save(update_fields=["status", "rejection_reason", "reviewed_by", "decided_at"])
        send_application_rejected_email(application=application, request=None)
    return applications


def _next_admission_number(school) -> str:
    from apps.students.models import Student

    count = Student.unscoped_objects.filter(school=school).count()
    return f"APP-{count + 1:05d}"


def _create_user_without_email(*, email, first_name, last_name, school):
    """Mirrors the account-creation half of apps.users.services.invite_user, deliberately without
    calling it directly — invite_user sends its own "your account is ready" email, but the
    acceptance flow needs ONE combined "you're accepted, here are your sign-in details" email
    (see apps.admissions.emails), not two separate emails for the same event."""
    from apps.users.models import User

    password = generate_default_password(school)
    user = User.objects.create(
        email=email, first_name=first_name, last_name=last_name, school=school,
        user_type=User.UserType.SCHOOL_USER, is_active=True,
    )
    user.set_password(password)
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])
    return user, password


@transaction.atomic
def accept_student_application(application, *, actor, request=None):
    from apps.students.models import Student
    from apps.students.services import provision_student_account

    if application.applying_for_class_id is None:
        raise ApplicationAcceptError("No class was specified on this application.")

    student = Student.objects.create(
        school=application.school,
        admission_number=_next_admission_number(application.school),
        first_name=application.first_name,
        middle_name=application.middle_name,
        last_name=application.last_name,
        date_of_birth=application.date_of_birth,
        gender=application.gender,
        address=application.address,
        previous_school=application.previous_school,
        admission_date=timezone.now().date(),
        status=Student.Status.ADMITTED,
        current_class=application.applying_for_class,
    )
    try:
        user = provision_student_account(student)
    except IntegrityError as exc:
        raise ApplicationAcceptError(
            "Could not create a sign-in account — a school-issued address for this student "
            "already exists."
        ) from exc

    if user is not None:
        password = generate_default_password(application.school)
        send_application_accepted_student_email(
            application=application, user=user, password=password, request=request
        )

    application.status = Application.Status.ACCEPTED
    application.reviewed_by = actor
    application.decided_at = timezone.now()
    application.created_student = student
    application.save(update_fields=["status", "reviewed_by", "decided_at", "created_student"])
    log_action(
        action="admissions.application_accepted",
        actor=actor,
        school=application.school,
        entity_type="Application",
        entity_id=str(application.id),
        after={"created_student": str(student.id)},
    )
    return student


@transaction.atomic
def accept_staff_application(application, *, actor, request=None):
    from apps.staff.models import Staff

    if application.applying_for_role_id is None:
        raise ApplicationAcceptError("No role was specified on this application.")

    try:
        user, password = _create_user_without_email(
            email=application.email,
            first_name=application.first_name,
            last_name=application.last_name,
            school=application.school,
        )
    except IntegrityError as exc:
        raise ApplicationAcceptError(
            f'An account with the email "{application.email}" already exists.'
        ) from exc

    assign_role(user=user, role=application.applying_for_role, assigned_by=actor)
    staff = Staff.objects.create(
        school=application.school,
        user=user,
        job_title=application.job_title,
        qualification=application.qualification,
        hire_date=timezone.now().date(),
        employment_status=Staff.EmploymentStatus.ACTIVE,
    )
    send_application_accepted_staff_email(
        application=application,
        user=user,
        password=password,
        role_label=application.applying_for_role.name,
        request=request,
    )

    application.status = Application.Status.ACCEPTED
    application.reviewed_by = actor
    application.decided_at = timezone.now()
    application.created_staff = staff
    application.save(update_fields=["status", "reviewed_by", "decided_at", "created_staff"])
    log_action(
        action="admissions.application_accepted",
        actor=actor,
        school=application.school,
        entity_type="Application",
        entity_id=str(application.id),
        after={"created_staff": str(staff.id)},
    )
    return staff


def accept_application(application, *, actor, request=None):
    if application.kind == Application.Kind.STUDENT:
        return accept_student_application(application, actor=actor, request=request)
    return accept_staff_application(application, actor=actor, request=request)
