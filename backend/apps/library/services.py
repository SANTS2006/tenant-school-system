from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import DEFAULT_FINE_PER_DAY, DEFAULT_LOAN_DAYS, MAX_RENEWALS, BookCopy, BookLoan


class LibraryError(Exception):
    """Raised for library business-rule violations — callers turn this into a 400."""


@transaction.atomic
def checkout_book(*, copy, student=None, staff=None, loan_days: int = DEFAULT_LOAN_DAYS) -> BookLoan:
    """
    Locks the copy row so two simultaneous checkout requests for the same
    physical copy can't both succeed — the second sees `status != available`
    once it acquires the lock (after the first commits) and is rejected.
    Same select_for_update()-then-recheck template as
    apps.finance.services.record_payment(). Uses `unscoped_objects` for the
    same reason documented there: this is called from request-scoped views
    *and* directly (tests), so it can't depend on ambient tenant context.
    """
    copy = BookCopy.unscoped_objects.select_for_update().get(pk=copy.pk)

    if copy.status != BookCopy.Status.AVAILABLE:
        raise LibraryError(f"This copy is not available (status: {copy.status}).")
    if bool(student) == bool(staff):
        raise LibraryError("Exactly one of student or staff must borrow the book.")

    today = timezone.now().date()
    loan = BookLoan.objects.create(
        school=copy.school,
        copy=copy,
        student=student,
        staff=staff,
        borrowed_date=today,
        due_date=today + timedelta(days=loan_days),
    )
    copy.status = BookCopy.Status.BORROWED
    copy.save(update_fields=["status", "updated_at"])
    return loan


@transaction.atomic
def return_book(*, loan, fine_per_day: Decimal = DEFAULT_FINE_PER_DAY) -> BookLoan:
    loan = BookLoan.unscoped_objects.select_for_update().get(pk=loan.pk)
    copy = BookCopy.unscoped_objects.select_for_update().get(pk=loan.copy_id)

    if loan.status != BookLoan.Status.BORROWED:
        raise LibraryError(f"This loan is not currently borrowed (status: {loan.status}).")

    today = timezone.now().date()
    overdue_days = max((today - loan.due_date).days, 0)
    loan.fine_amount = fine_per_day * overdue_days
    loan.returned_date = today
    loan.status = BookLoan.Status.RETURNED
    loan.save(update_fields=["fine_amount", "returned_date", "status", "updated_at"])

    copy.status = BookCopy.Status.AVAILABLE
    copy.save(update_fields=["status", "updated_at"])
    return loan


@transaction.atomic
def renew_loan(*, loan, loan_days: int = DEFAULT_LOAN_DAYS) -> BookLoan:
    loan = BookLoan.unscoped_objects.select_for_update().get(pk=loan.pk)

    if loan.status != BookLoan.Status.BORROWED:
        raise LibraryError(f"This loan is not currently borrowed (status: {loan.status}).")
    if loan.renewal_count >= MAX_RENEWALS:
        raise LibraryError(f"This loan has already been renewed the maximum ({MAX_RENEWALS}) times.")

    loan.due_date = loan.due_date + timedelta(days=loan_days)
    loan.renewal_count += 1
    loan.save(update_fields=["due_date", "renewal_count", "updated_at"])
    return loan
