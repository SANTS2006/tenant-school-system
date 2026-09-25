export type ExamType = "exam" | "test" | "quiz" | "continuous_assessment" | "practical";

export type ResultStatus = "draft" | "submitted" | "reviewed" | "approved" | "published" | "locked";

export interface GradingScale {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingScalePayload {
  name: string;
  is_default: boolean;
}

/** Decimal fields come back as strings from DRF (e.g. `"72.50"`), not numbers — parse with
 * `Number()` only where an actual computation is needed (a percentage, a comparison). */
export interface GradeBoundary {
  id: string;
  grading_scale: string;
  grade: string;
  min_score: string;
  max_score: string;
  gpa_value: string | null;
}

export interface GradeBoundaryPayload {
  grading_scale: string;
  grade: string;
  min_score: string;
  max_score: string;
  gpa_value?: string;
}

export interface Exam {
  id: string;
  name: string;
  exam_type: ExamType;
  term: string;
  term_name: string;
  grading_scale: string | null;
  grading_scale_name: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExamPayload {
  name: string;
  exam_type: ExamType;
  term: string;
  grading_scale?: string;
  start_date: string;
  end_date: string;
}

export interface ExamListParams {
  page?: number;
  page_size?: number;
  search?: string;
  term?: string;
  exam_type?: ExamType;
  ordering?: string;
}

/** One subject's sitting within an `Exam`, for one class — this is what a `Result` actually
 * attaches to (`exam_schedule`), not the `Exam` directly. */
export interface ExamSchedule {
  id: string;
  exam: string;
  exam_name: string;
  school_class: string;
  school_class_name: string;
  subject: string;
  subject_name: string;
  max_score: string;
  date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamSchedulePayload {
  exam: string;
  school_class: string;
  subject: string;
  max_score: string;
  date?: string;
}

export interface ExamScheduleListParams {
  page?: number;
  page_size?: number;
  exam?: string;
  school_class?: string;
  subject?: string;
}

/** `ca_score`/`score`/`grade`/`status`/`locked_at` are all read-only or derived — `ca_score` is a
 * snapshot of the subject's weighted-assignment average, computed once whenever `exam_score` is
 * entered/changed; `score` is the auto-combined final value; `grade` is always server-computed
 * from the exam's grading scale; `status` only changes through the dedicated workflow actions
 * (submit/review/approve/publish/lock/correct), never a plain PATCH once past `draft`.
 * `exam_score` — the raw exam-portion score, out of the exam schedule's own `max_score`, NOT the
 * final score — is the one field a caller actually writes (see ResultEditPage.tsx /
 * EnterMarksPage.tsx). Either `ca_score` or `score` can be `null` even once `exam_score` is set,
 * if no graded assignments exist yet for that subject/term — see `compute_ca_score`'s backend
 * docstring. */
export interface Result {
  id: string;
  exam_schedule: string;
  exam_schedule_label: string;
  student: string;
  student_name: string;
  exam_score: string | null;
  ca_score: string | null;
  score: string | null;
  grade: string;
  teacher_comment: string;
  status: ResultStatus;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultListParams {
  page?: number;
  page_size?: number;
  exam_schedule?: string;
  student?: string;
  status?: ResultStatus;
  ordering?: string;
}

export interface ResultPayload {
  exam_schedule: string;
  student: string;
  exam_score?: string;
  teacher_comment?: string;
}

/** Only `exam_score`/`teacher_comment` for an existing (draft) result — the exam schedule and
 * student a result belongs to aren't sensible to change after creation. `ca_score`/`score` are
 * recomputed server-side whenever `exam_score` changes (see ResultViewSet.perform_update). */
export interface ResultEditPayload {
  exam_score?: string;
  teacher_comment?: string;
}

export interface BulkEnterEntry {
  student_id: string;
  exam_score?: string;
  teacher_comment?: string;
}

export interface BulkEnterPayload {
  exam_schedule: string;
  entries: BulkEnterEntry[];
}

export interface BulkEnterSkipped {
  student_id: string;
  status: ResultStatus;
}

export interface BulkEnterResponse {
  message: string;
  results: Result[];
  skipped: BulkEnterSkipped[];
}

/** `score` sets the final score directly (a plain manual override); `exam_score` instead
 * re-runs the same CA-lookup + combination `enter_exam_score` uses — pass at most one. */
export interface CorrectResultPayload {
  score?: string;
  exam_score?: string;
  teacher_comment?: string;
  reason: string;
}

export interface ReportCardEntry {
  subject: string;
  exam: string;
  ca_score: string | null;
  exam_score: string | null;
  score: string | null;
  max_score: string;
  grade: string;
  teacher_comment: string;
}

export interface ReportCard {
  student: { id: string; name: string };
  results: ReportCardEntry[];
  average: number | null;
}

export interface TranscriptTerm {
  id: string;
  name: string;
  results: ReportCardEntry[];
}

export interface Transcript {
  school: { id: string; name: string; slug: string; logo: string | null } | null;
  student: { id: string; name: string } | null;
  terms: TranscriptTerm[];
}
