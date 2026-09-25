from decimal import Decimal

from django.db import transaction
from django.db.models import Q

from .models import ExamSchedule, Result


def compute_ca_score(*, student, subject, school_class, term):
    """
    The weighted average of `student`'s graded Assignments for `subject`/`school_class`/`term`,
    on a 0-100 scale — the CA (continuous assessment) component of a final grade.

    Each Assignment carries its own teacher-set `weight` (a relative share, not required to sum
    to 100 across a subject's assignments — see Assignment.weight's docstring). This normalizes
    by the sum of weights of assignments the student actually has a GRADED submission for, not
    every assignment that exists — so a term that's only half-graded so far still produces a
    correct average from what *is* graded, rather than understating it by dividing by every
    assignment's weight regardless of grading status.

    Scoped by `term` via the assignment's own `term` FK where set; for legacy assignments created
    before that field existed (term is null), falls back to matching by `due_date` falling within
    the term's date range — a Subject/Term pair predates nothing else `Assignment` could key off.

    Returns `None` if the student has zero graded submissions for this scope — callers (see
    `enter_exam_score`) must not treat that as a CA score of zero.
    """
    from apps.assignments.models import Assignment, AssignmentSubmission

    assignments = Assignment.objects.filter(
        subject=subject, school_class=school_class, is_active=True
    ).filter(Q(term=term) | Q(term__isnull=True, due_date__date__range=(term.start_date, term.end_date)))

    submissions = AssignmentSubmission.objects.filter(
        assignment__in=assignments,
        student=student,
        status=AssignmentSubmission.Status.GRADED,
        score__isnull=False,
    ).select_related("assignment")

    weighted_sum = Decimal("0")
    weight_total = Decimal("0")
    for submission in submissions:
        assignment = submission.assignment
        if not assignment.max_score:
            continue
        pct = (submission.score / assignment.max_score) * 100
        weighted_sum += pct * assignment.weight
        weight_total += assignment.weight

    if weight_total == 0:
        return None
    return round(weighted_sum / weight_total, 2)


def combine_score(*, exam_score, exam_schedule: ExamSchedule, student):
    """
    Resolves the CA component for `student` on `exam_schedule`'s subject/class/term and combines
    it with `exam_score` into `(ca_score, final_score)`. `ca_score`/`final_score` are both `None`
    if no CA data exists yet (see `compute_ca_score`'s own docstring for why that's never treated
    as zero). Shared by both `enter_exam_score` (the normal draft-only entry path) and
    `ResultViewSet.correct` (the locked-result override path, which bypasses the draft-only guard
    on purpose — see that view for why).
    """
    subject = exam_schedule.subject
    ca_avg_pct = compute_ca_score(
        student=student, subject=subject, school_class=exam_schedule.school_class, term=exam_schedule.exam.term
    )
    if ca_avg_pct is None or exam_score is None:
        return None, None
    exam_pct = (exam_score / exam_schedule.max_score) * 100
    final_score = round(ca_avg_pct * subject.ca_weight_percent / 100 + exam_pct * subject.exam_weight_percent / 100, 2)
    return ca_avg_pct, final_score


@transaction.atomic
def enter_exam_score(*, exam_schedule: ExamSchedule, student, exam_score, teacher_comment: str = "") -> Result:
    """
    The Exams Director's entry point — writes the raw exam-portion score, computes (or leaves
    pending) the CA component, and combines them into the final `Result.score`. Only ever touches
    a `draft` result, mirroring `bulk_enter`'s existing "don't overwrite anything already past
    draft" guard.

    If no CA data exists yet for this student/subject/term, `exam_score` is still saved — nothing
    already entered is lost — but `ca_score`/`score` are left `null` rather than treating the
    missing CA as zero, so an incomplete grade can never be silently published. `ResultViewSet`'s
    own status-transition guards (submit/publish) already require a result to be in a sane state;
    a `null` `score` simply can't be meaningfully submitted for review until CA data exists.
    """
    ca_score, final_score = combine_score(exam_score=exam_score, exam_schedule=exam_schedule, student=student)
    defaults = {"exam_score": exam_score, "ca_score": ca_score, "score": final_score, "teacher_comment": teacher_comment}

    result, created = Result.objects.get_or_create(
        exam_schedule=exam_schedule,
        student=student,
        defaults={"school": exam_schedule.school, **defaults},
    )
    if not created:
        if result.status != Result.Status.DRAFT:
            return result
        for field, value in defaults.items():
            setattr(result, field, value)
        result.save()
    return result
