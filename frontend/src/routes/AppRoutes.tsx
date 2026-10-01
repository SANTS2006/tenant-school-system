import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { FullPageSpinner } from "@/components/ui/Spinner";

import { CategoriesListPage as DocumentCategoriesListPage } from "@/features/documents/CategoriesListPage";
import { CategoryFormPage as DocumentCategoryFormPage } from "@/features/documents/CategoryFormPage";
import { CategoriesListPage as InventoryCategoriesListPage } from "@/features/inventory/CategoriesListPage";
import { CategoryFormPage as InventoryCategoryFormPage } from "@/features/inventory/CategoryFormPage";
import { ItemFormPage as InventoryItemFormPage } from "@/features/inventory/ItemFormPage";
import { ItemsListPage as InventoryItemsListPage } from "@/features/inventory/ItemsListPage";
import { TransactionsListPage as InventoryTransactionsListPage } from "@/features/inventory/TransactionsListPage";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PlatformShell } from "@/layouts/PlatformShell";

import { ProtectedRoute } from "./ProtectedRoute";

// Every page is its own chunk, fetched when first visited — the app shell stays small, which
// matters for an installable app opened from a phone's home screen.
const ApplicationDetailPage = lazy(() => import("@/features/admissions/ApplicationDetailPage").then((m) => ({ default: m.ApplicationDetailPage })));
const ApplicationFormBuilderPage = lazy(() => import("@/features/admissions/ApplicationFormBuilderPage").then((m) => ({ default: m.ApplicationFormBuilderPage })));
const ApplicationsListPage = lazy(() => import("@/features/admissions/ApplicationsListPage").then((m) => ({ default: m.ApplicationsListPage })));
const PublicApplyPage = lazy(() => import("@/features/admissions/PublicApplyPage").then((m) => ({ default: m.PublicApplyPage })));
const AcademicYearFormPage = lazy(() => import("@/features/academics/AcademicYearFormPage").then((m) => ({ default: m.AcademicYearFormPage })));
const AcademicYearsListPage = lazy(() => import("@/features/academics/AcademicYearsListPage").then((m) => ({ default: m.AcademicYearsListPage })));
const AcademicsLayout = lazy(() => import("@/features/academics/AcademicsLayout").then((m) => ({ default: m.AcademicsLayout })));
const DepartmentFormPage = lazy(() => import("@/features/academics/DepartmentFormPage").then((m) => ({ default: m.DepartmentFormPage })));
const DepartmentsListPage = lazy(() => import("@/features/academics/DepartmentsListPage").then((m) => ({ default: m.DepartmentsListPage })));
const SchoolClassFormPage = lazy(() => import("@/features/academics/SchoolClassFormPage").then((m) => ({ default: m.SchoolClassFormPage })));
const ClassResultsPage = lazy(() => import("@/features/academics/ClassResultsPage").then((m) => ({ default: m.ClassResultsPage })));
const StudentGraduationStatusPage = lazy(() => import("@/features/academics/StudentGraduationStatusPage").then((m) => ({ default: m.StudentGraduationStatusPage })));
const StudentTermReportPage = lazy(() => import("@/features/academics/StudentTermReportPage").then((m) => ({ default: m.StudentTermReportPage })));
const SchoolClassesListPage = lazy(() => import("@/features/academics/SchoolClassesListPage").then((m) => ({ default: m.SchoolClassesListPage })));
const SectionFormPage = lazy(() => import("@/features/academics/SectionFormPage").then((m) => ({ default: m.SectionFormPage })));
const SectionsListPage = lazy(() => import("@/features/academics/SectionsListPage").then((m) => ({ default: m.SectionsListPage })));
const SubjectFormPage = lazy(() => import("@/features/academics/SubjectFormPage").then((m) => ({ default: m.SubjectFormPage })));
const SubjectsListPage = lazy(() => import("@/features/academics/SubjectsListPage").then((m) => ({ default: m.SubjectsListPage })));
const AssessmentGradeEntryPage = lazy(() => import("@/features/academics/AssessmentGradeEntryPage").then((m) => ({ default: m.AssessmentGradeEntryPage })));
const MySubjectCAPage = lazy(() => import("@/features/academics/MySubjectCAPage").then((m) => ({ default: m.MySubjectCAPage })));
const MySubjectCommunicationsPage = lazy(() => import("@/features/academics/MySubjectCommunicationsPage").then((m) => ({ default: m.MySubjectCommunicationsPage })));
const MySubjectLessonsPage = lazy(() => import("@/features/academics/MySubjectLessonsPage").then((m) => ({ default: m.MySubjectLessonsPage })));
const MyResultDetailPage = lazy(() => import("@/features/academics/MyResultDetailPage").then((m) => ({ default: m.MyResultDetailPage })));
const MyGraduationStatusPage = lazy(() => import("@/features/academics/MyGraduationStatusPage").then((m) => ({ default: m.MyGraduationStatusPage })));
const MyResultsPage = lazy(() => import("@/features/academics/MyResultsPage").then((m) => ({ default: m.MyResultsPage })));
const TeacherSubjectLessonsPage = lazy(() => import("@/features/academics/TeacherSubjectLessonsPage").then((m) => ({ default: m.TeacherSubjectLessonsPage })));
const TeacherSubjectsPage = lazy(() => import("@/features/academics/TeacherSubjectsPage").then((m) => ({ default: m.TeacherSubjectsPage })));
const MySubjectsPage = lazy(() => import("@/features/academics/MySubjectsPage").then((m) => ({ default: m.MySubjectsPage })));
const SubjectOfferingCAPage = lazy(() => import("@/features/academics/SubjectOfferingCAPage").then((m) => ({ default: m.SubjectOfferingCAPage })));
const SubjectOfferingCommunicationsPage = lazy(() => import("@/features/academics/SubjectOfferingCommunicationsPage").then((m) => ({ default: m.SubjectOfferingCommunicationsPage })));
const TeacherSubjectPrivateThreadPage = lazy(() => import("@/features/academics/TeacherSubjectPrivateThreadPage").then((m) => ({ default: m.TeacherSubjectPrivateThreadPage })));
const SubjectResultsPage = lazy(() => import("@/features/academics/SubjectResultsPage").then((m) => ({ default: m.SubjectResultsPage })));
const SubjectOfferingFormPage = lazy(() => import("@/features/academics/SubjectOfferingFormPage").then((m) => ({ default: m.SubjectOfferingFormPage })));
const SubjectOfferingRosterPage = lazy(() => import("@/features/academics/SubjectOfferingRosterPage").then((m) => ({ default: m.SubjectOfferingRosterPage })));
const SubjectOfferingsListPage = lazy(() => import("@/features/academics/SubjectOfferingsListPage").then((m) => ({ default: m.SubjectOfferingsListPage })));
const TermFormPage = lazy(() => import("@/features/academics/TermFormPage").then((m) => ({ default: m.TermFormPage })));
const TermsListPage = lazy(() => import("@/features/academics/TermsListPage").then((m) => ({ default: m.TermsListPage })));
const GradeSubmissionFormPage = lazy(() => import("@/features/assignments/GradeSubmissionFormPage").then((m) => ({ default: m.GradeSubmissionFormPage })));
const HomeworkAssignmentFormPage = lazy(() => import("@/features/assignments/HomeworkAssignmentFormPage").then((m) => ({ default: m.HomeworkAssignmentFormPage })));
const HomeworkAssignmentsListPage = lazy(() => import("@/features/assignments/HomeworkAssignmentsListPage").then((m) => ({ default: m.HomeworkAssignmentsListPage })));
const SubmissionsListPage = lazy(() => import("@/features/assignments/SubmissionsListPage").then((m) => ({ default: m.SubmissionsListPage })));
const AttendanceIndexRedirect = lazy(() => import("@/features/attendance/AttendanceIndexRedirect").then((m) => ({ default: m.AttendanceIndexRedirect })));
const AttendanceLayout = lazy(() => import("@/features/attendance/AttendanceLayout").then((m) => ({ default: m.AttendanceLayout })));
const AttendanceRecordFormPage = lazy(() => import("@/features/attendance/AttendanceRecordFormPage").then((m) => ({ default: m.AttendanceRecordFormPage })));
const AttendanceRecordsPage = lazy(() => import("@/features/attendance/AttendanceRecordsPage").then((m) => ({ default: m.AttendanceRecordsPage })));
const MyAttendancePage = lazy(() => import("@/features/attendance/MyAttendancePage").then((m) => ({ default: m.MyAttendancePage })));
const MyStaffAttendancePage = lazy(() => import("@/features/attendance/MyStaffAttendancePage").then((m) => ({ default: m.MyStaffAttendancePage })));
const AttendanceStatsPage = lazy(() => import("@/features/attendance/AttendanceStatsPage").then((m) => ({ default: m.AttendanceStatsPage })));
const StaffAttendanceFormPage = lazy(() => import("@/features/attendance/StaffAttendanceFormPage").then((m) => ({ default: m.StaffAttendanceFormPage })));
const StaffAttendanceListPage = lazy(() => import("@/features/attendance/StaffAttendanceListPage").then((m) => ({ default: m.StaffAttendanceListPage })));
const TakeAttendancePage = lazy(() => import("@/features/attendance/TakeAttendancePage").then((m) => ({ default: m.TakeAttendancePage })));
const PermissionFormPage = lazy(() => import("@/features/authorization/PermissionFormPage").then((m) => ({ default: m.PermissionFormPage })));
const PermissionsListPage = lazy(() => import("@/features/authorization/PermissionsListPage").then((m) => ({ default: m.PermissionsListPage })));
const RoleDetailPage = lazy(() => import("@/features/authorization/RoleDetailPage").then((m) => ({ default: m.RoleDetailPage })));
const RoleFormPage = lazy(() => import("@/features/authorization/RoleFormPage").then((m) => ({ default: m.RoleFormPage })));
const RolesListPage = lazy(() => import("@/features/authorization/RolesListPage").then((m) => ({ default: m.RolesListPage })));
const AuditLogDetailPage = lazy(() => import("@/features/audit/AuditLogDetailPage").then((m) => ({ default: m.AuditLogDetailPage })));
const AuditLogsListPage = lazy(() => import("@/features/audit/AuditLogsListPage").then((m) => ({ default: m.AuditLogsListPage })));
const BrandedLoginPage = lazy(() => import("@/features/auth/BrandedLoginPage").then((m) => ({ default: m.BrandedLoginPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const TwoFactorPage = lazy(() => import("@/features/auth/TwoFactorPage").then((m) => ({ default: m.TwoFactorPage })));
const ResetPasswordPage = lazy(() => import("@/features/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const AnnouncementFormPage = lazy(() => import("@/features/communications/AnnouncementFormPage").then((m) => ({ default: m.AnnouncementFormPage })));
const AnnouncementsListPage = lazy(() => import("@/features/communications/AnnouncementsListPage").then((m) => ({ default: m.AnnouncementsListPage })));
const RecipientFormPage = lazy(() => import("@/features/communications/RecipientFormPage").then((m) => ({ default: m.RecipientFormPage })));
const RecipientsListPage = lazy(() => import("@/features/communications/RecipientsListPage").then((m) => ({ default: m.RecipientsListPage })));
const ComplaintDetailPage = lazy(() => import("@/features/complaints/ComplaintDetailPage").then((m) => ({ default: m.ComplaintDetailPage })));
const ComplaintFormPage = lazy(() => import("@/features/complaints/ComplaintFormPage").then((m) => ({ default: m.ComplaintFormPage })));
const ComplaintsListPage = lazy(() => import("@/features/complaints/ComplaintsListPage").then((m) => ({ default: m.ComplaintsListPage })));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const IncidentFormPage = lazy(() => import("@/features/discipline/IncidentFormPage").then((m) => ({ default: m.IncidentFormPage })));
const IncidentsListPage = lazy(() => import("@/features/discipline/IncidentsListPage").then((m) => ({ default: m.IncidentsListPage })));
const DocumentFormPage = lazy(() => import("@/features/documents/DocumentFormPage").then((m) => ({ default: m.DocumentFormPage })));
const DocumentsLayout = lazy(() => import("@/features/documents/DocumentsLayout").then((m) => ({ default: m.DocumentsLayout })));
const DocumentsListPage = lazy(() => import("@/features/documents/DocumentsListPage").then((m) => ({ default: m.DocumentsListPage })));
const LessonDetailPage = lazy(() => import("@/features/education/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })));
const LessonFormPage = lazy(() => import("@/features/education/LessonFormPage").then((m) => ({ default: m.LessonFormPage })));
const LessonsListPage = lazy(() => import("@/features/education/LessonsListPage").then((m) => ({ default: m.LessonsListPage })));
const MyLessonsPage = lazy(() => import("@/features/education/MyLessonsPage").then((m) => ({ default: m.MyLessonsPage })));
const MyDisciplinePage = lazy(() => import("@/features/discipline/MyDisciplinePage").then((m) => ({ default: m.MyDisciplinePage })));
const MyMedicalPage = lazy(() => import("@/features/medical/MyMedicalPage").then((m) => ({ default: m.MyMedicalPage })));
const MyTransportPage = lazy(() => import("@/features/transport/MyTransportPage").then((m) => ({ default: m.MyTransportPage })));
const BuildTimetablePage = lazy(() => import("@/features/timetable/BuildTimetablePage").then((m) => ({ default: m.BuildTimetablePage })));
const MyTimetablePage = lazy(() => import("@/features/timetable/MyTimetablePage").then((m) => ({ default: m.MyTimetablePage })));
const MyDocumentsPage = lazy(() => import("@/features/documents/MyDocumentsPage").then((m) => ({ default: m.MyDocumentsPage })));
const EventDetailPage = lazy(() => import("@/features/events/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const EventFormPage = lazy(() => import("@/features/events/EventFormPage").then((m) => ({ default: m.EventFormPage })));
const EventsListPage = lazy(() => import("@/features/events/EventsListPage").then((m) => ({ default: m.EventsListPage })));
const ExamFormPage = lazy(() => import("@/features/examinations/ExamFormPage").then((m) => ({ default: m.ExamFormPage })));
const ExaminationsIndexRedirect = lazy(() => import("@/features/examinations/ExaminationsIndexRedirect").then((m) => ({ default: m.ExaminationsIndexRedirect })));
const ExaminationsLayout = lazy(() => import("@/features/examinations/ExaminationsLayout").then((m) => ({ default: m.ExaminationsLayout })));
const ExamSchedulesListPage = lazy(() => import("@/features/examinations/ExamSchedulesListPage").then((m) => ({ default: m.ExamSchedulesListPage })));
const ExamScheduleFormPage = lazy(() => import("@/features/examinations/ExamScheduleFormPage").then((m) => ({ default: m.ExamScheduleFormPage })));
const ExamsListPage = lazy(() => import("@/features/examinations/ExamsListPage").then((m) => ({ default: m.ExamsListPage })));
const GradeBoundariesListPage = lazy(() => import("@/features/examinations/GradeBoundariesListPage").then((m) => ({ default: m.GradeBoundariesListPage })));
const GradeBoundaryFormPage = lazy(() => import("@/features/examinations/GradeBoundaryFormPage").then((m) => ({ default: m.GradeBoundaryFormPage })));
const GradingScaleFormPage = lazy(() => import("@/features/examinations/GradingScaleFormPage").then((m) => ({ default: m.GradingScaleFormPage })));
const GradingScalesListPage = lazy(() => import("@/features/examinations/GradingScalesListPage").then((m) => ({ default: m.GradingScalesListPage })));
const TranscriptPage = lazy(() => import("@/features/examinations/TranscriptPage").then((m) => ({ default: m.TranscriptPage })));
const FeeCategoriesListPage = lazy(() => import("@/features/finance/FeeCategoriesListPage").then((m) => ({ default: m.FeeCategoriesListPage })));
const FeeCategoryFormPage = lazy(() => import("@/features/finance/FeeCategoryFormPage").then((m) => ({ default: m.FeeCategoryFormPage })));
const FeeStructureFormPage = lazy(() => import("@/features/finance/FeeStructureFormPage").then((m) => ({ default: m.FeeStructureFormPage })));
const FeeStructureItemFormPage = lazy(() => import("@/features/finance/FeeStructureItemFormPage").then((m) => ({ default: m.FeeStructureItemFormPage })));
const FeeStructureItemsListPage = lazy(() => import("@/features/finance/FeeStructureItemsListPage").then((m) => ({ default: m.FeeStructureItemsListPage })));
const FeeStructuresListPage = lazy(() => import("@/features/finance/FeeStructuresListPage").then((m) => ({ default: m.FeeStructuresListPage })));
const FinanceIndexRedirect = lazy(() => import("@/features/finance/FinanceIndexRedirect").then((m) => ({ default: m.FinanceIndexRedirect })));
const FinanceLayout = lazy(() => import("@/features/finance/FinanceLayout").then((m) => ({ default: m.FinanceLayout })));
const FinanceStatsPage = lazy(() => import("@/features/finance/FinanceStatsPage").then((m) => ({ default: m.FinanceStatsPage })));
const GenerateInvoicesPage = lazy(() => import("@/features/finance/GenerateInvoicesPage").then((m) => ({ default: m.GenerateInvoicesPage })));
const InvoiceDetailPage = lazy(() => import("@/features/finance/InvoiceDetailPage").then((m) => ({ default: m.InvoiceDetailPage })));
const InvoiceFormPage = lazy(() => import("@/features/finance/InvoiceFormPage").then((m) => ({ default: m.InvoiceFormPage })));
const InvoiceLineItemFormPage = lazy(() => import("@/features/finance/InvoiceLineItemFormPage").then((m) => ({ default: m.InvoiceLineItemFormPage })));
const InvoiceLineItemsListPage = lazy(() => import("@/features/finance/InvoiceLineItemsListPage").then((m) => ({ default: m.InvoiceLineItemsListPage })));
const InvoicesListPage = lazy(() => import("@/features/finance/InvoicesListPage").then((m) => ({ default: m.InvoicesListPage })));
const PaymentFormPage = lazy(() => import("@/features/finance/PaymentFormPage").then((m) => ({ default: m.PaymentFormPage })));
const PaymentReceiptPage = lazy(() => import("@/features/finance/PaymentReceiptPage").then((m) => ({ default: m.PaymentReceiptPage })));
const PaymentsListPage = lazy(() => import("@/features/finance/PaymentsListPage").then((m) => ({ default: m.PaymentsListPage })));
const RefundFormPage = lazy(() => import("@/features/finance/RefundFormPage").then((m) => ({ default: m.RefundFormPage })));
const GenerateSalaryPaymentsPage = lazy(() => import("@/features/salary/GenerateSalaryPaymentsPage").then((m) => ({ default: m.GenerateSalaryPaymentsPage })));
const PaySalaryPaymentPage = lazy(() => import("@/features/salary/PaySalaryPaymentPage").then((m) => ({ default: m.PaySalaryPaymentPage })));
const SalaryIndexRedirect = lazy(() => import("@/features/salary/SalaryIndexRedirect").then((m) => ({ default: m.SalaryIndexRedirect })));
const SalaryLayout = lazy(() => import("@/features/salary/SalaryLayout").then((m) => ({ default: m.SalaryLayout })));
const SalaryPaymentReceiptPage = lazy(() => import("@/features/salary/SalaryPaymentReceiptPage").then((m) => ({ default: m.SalaryPaymentReceiptPage })));
const SalaryPaymentsListPage = lazy(() => import("@/features/salary/SalaryPaymentsListPage").then((m) => ({ default: m.SalaryPaymentsListPage })));
const SalaryStructureFormPage = lazy(() => import("@/features/salary/SalaryStructureFormPage").then((m) => ({ default: m.SalaryStructureFormPage })));
const SalaryStructureItemFormPage = lazy(() => import("@/features/salary/SalaryStructureItemFormPage").then((m) => ({ default: m.SalaryStructureItemFormPage })));
const SalaryStructureItemsListPage = lazy(() => import("@/features/salary/SalaryStructureItemsListPage").then((m) => ({ default: m.SalaryStructureItemsListPage })));
const SalaryStructuresListPage = lazy(() => import("@/features/salary/SalaryStructuresListPage").then((m) => ({ default: m.SalaryStructuresListPage })));
const StaffSalaryAssignmentFormPage = lazy(() => import("@/features/salary/StaffSalaryAssignmentFormPage").then((m) => ({ default: m.StaffSalaryAssignmentFormPage })));
const StaffSalaryAssignmentsListPage = lazy(() => import("@/features/salary/StaffSalaryAssignmentsListPage").then((m) => ({ default: m.StaffSalaryAssignmentsListPage })));
const AllocationFormPage = lazy(() => import("@/features/hostel/AllocationFormPage").then((m) => ({ default: m.AllocationFormPage })));
const AllocationsListPage = lazy(() => import("@/features/hostel/AllocationsListPage").then((m) => ({ default: m.AllocationsListPage })));
const BedFormPage = lazy(() => import("@/features/hostel/BedFormPage").then((m) => ({ default: m.BedFormPage })));
const BedsListPage = lazy(() => import("@/features/hostel/BedsListPage").then((m) => ({ default: m.BedsListPage })));
const HostelFormPage = lazy(() => import("@/features/hostel/HostelFormPage").then((m) => ({ default: m.HostelFormPage })));
const HostelLayout = lazy(() => import("@/features/hostel/HostelLayout").then((m) => ({ default: m.HostelLayout })));
const HostelRoomFormPage = lazy(() => import("@/features/hostel/HostelRoomFormPage").then((m) => ({ default: m.HostelRoomFormPage })));
const HostelRoomsListPage = lazy(() => import("@/features/hostel/HostelRoomsListPage").then((m) => ({ default: m.HostelRoomsListPage })));
const HostelsListPage = lazy(() => import("@/features/hostel/HostelsListPage").then((m) => ({ default: m.HostelsListPage })));
const InventoryLayout = lazy(() => import("@/features/inventory/InventoryLayout").then((m) => ({ default: m.InventoryLayout })));
const StockAdjustmentFormPage = lazy(() => import("@/features/inventory/StockAdjustmentFormPage").then((m) => ({ default: m.StockAdjustmentFormPage })));
const BookCopiesListPage = lazy(() => import("@/features/library/BookCopiesListPage").then((m) => ({ default: m.BookCopiesListPage })));
const BookCopyFormPage = lazy(() => import("@/features/library/BookCopyFormPage").then((m) => ({ default: m.BookCopyFormPage })));
const BookFormPage = lazy(() => import("@/features/library/BookFormPage").then((m) => ({ default: m.BookFormPage })));
const BooksListPage = lazy(() => import("@/features/library/BooksListPage").then((m) => ({ default: m.BooksListPage })));
const CategoriesListPage = lazy(() => import("@/features/library/CategoriesListPage").then((m) => ({ default: m.CategoriesListPage })));
const CategoryFormPage = lazy(() => import("@/features/library/CategoryFormPage").then((m) => ({ default: m.CategoryFormPage })));
const CheckoutPage = lazy(() => import("@/features/library/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const LibraryLayout = lazy(() => import("@/features/library/LibraryLayout").then((m) => ({ default: m.LibraryLayout })));
const LoansListPage = lazy(() => import("@/features/library/LoansListPage").then((m) => ({ default: m.LoansListPage })));
const ReservationFormPage = lazy(() => import("@/features/library/ReservationFormPage").then((m) => ({ default: m.ReservationFormPage })));
const ReservationsListPage = lazy(() => import("@/features/library/ReservationsListPage").then((m) => ({ default: m.ReservationsListPage })));
const LiveSessionFormPage = lazy(() => import("@/features/live-sessions/LiveSessionFormPage").then((m) => ({ default: m.LiveSessionFormPage })));
const LiveSessionRoomPage = lazy(() => import("@/features/live-sessions/LiveSessionRoomPage").then((m) => ({ default: m.LiveSessionRoomPage })));
const LiveSessionsListPage = lazy(() => import("@/features/live-sessions/LiveSessionsListPage").then((m) => ({ default: m.LiveSessionsListPage })));
const MyLiveSessionsPage = lazy(() => import("@/features/live-sessions/MyLiveSessionsPage").then((m) => ({ default: m.MyLiveSessionsPage })));
const IdCardsPage = lazy(() => import("@/features/idcards/IdCardsPage").then((m) => ({ default: m.IdCardsPage })));
const MyIdCardPage = lazy(() => import("@/features/idcards/MyIdCardPage").then((m) => ({ default: m.MyIdCardPage })));
const NotificationDetailPage = lazy(() => import("@/features/notifications/NotificationDetailPage").then((m) => ({ default: m.NotificationDetailPage })));
const MeetingDetailPage = lazy(() => import("@/features/meetings/MeetingDetailPage").then((m) => ({ default: m.MeetingDetailPage })));
const MeetingFormPage = lazy(() => import("@/features/meetings/MeetingFormPage").then((m) => ({ default: m.MeetingFormPage })));
const MeetingRoomPage = lazy(() => import("@/features/meetings/MeetingRoomPage").then((m) => ({ default: m.MeetingRoomPage })));
const MeetingsListPage = lazy(() => import("@/features/meetings/MeetingsListPage").then((m) => ({ default: m.MeetingsListPage })));
const MyMeetingsPage = lazy(() => import("@/features/meetings/MyMeetingsPage").then((m) => ({ default: m.MyMeetingsPage })));
const PublicVerifyCardPage = lazy(() => import("@/features/idcards/PublicVerifyCardPage").then((m) => ({ default: m.PublicVerifyCardPage })));
const MyQuizzesPage = lazy(() => import("@/features/quizzes/MyQuizzesPage").then((m) => ({ default: m.MyQuizzesPage })));
const QuizResultsPage = lazy(() => import("@/features/quizzes/QuizResultsPage").then((m) => ({ default: m.QuizResultsPage })));
const SubjectOfferingQuizzesPage = lazy(() => import("@/features/quizzes/SubjectOfferingQuizzesPage").then((m) => ({ default: m.SubjectOfferingQuizzesPage })));
const TakeQuizPage = lazy(() => import("@/features/quizzes/TakeQuizPage").then((m) => ({ default: m.TakeQuizPage })));
const MedicalLayout = lazy(() => import("@/features/medical/MedicalLayout").then((m) => ({ default: m.MedicalLayout })));
const ProfileFormPage = lazy(() => import("@/features/medical/ProfileFormPage").then((m) => ({ default: m.ProfileFormPage })));
const ProfilesListPage = lazy(() => import("@/features/medical/ProfilesListPage").then((m) => ({ default: m.ProfilesListPage })));
const VisitFormPage = lazy(() => import("@/features/medical/VisitFormPage").then((m) => ({ default: m.VisitFormPage })));
const VisitsListPage = lazy(() => import("@/features/medical/VisitsListPage").then((m) => ({ default: m.VisitsListPage })));
const NotificationsListPage = lazy(() => import("@/features/notifications/NotificationsListPage").then((m) => ({ default: m.NotificationsListPage })));
const GuardianFormPage = lazy(() => import("@/features/parents/GuardianFormPage").then((m) => ({ default: m.GuardianFormPage })));
const GuardiansListPage = lazy(() => import("@/features/parents/GuardiansListPage").then((m) => ({ default: m.GuardiansListPage })));
const InvitePlatformAdminFormPage = lazy(() => import("@/features/platform/InvitePlatformAdminFormPage").then((m) => ({ default: m.InvitePlatformAdminFormPage })));
const PlatformAdminsListPage = lazy(() => import("@/features/platform/PlatformAdminsListPage").then((m) => ({ default: m.PlatformAdminsListPage })));
const PlatformOverviewPage = lazy(() => import("@/features/platform/PlatformOverviewPage").then((m) => ({ default: m.PlatformOverviewPage })));
const ProcurementLayout = lazy(() => import("@/features/procurement/ProcurementLayout").then((m) => ({ default: m.ProcurementLayout })));
const RecordDetailPage = lazy(() => import("@/features/records/RecordDetailPage").then((m) => ({ default: m.RecordDetailPage })));
const RecordFormPage = lazy(() => import("@/features/records/RecordFormPage").then((m) => ({ default: m.RecordFormPage })));
const RecordsListPage = lazy(() => import("@/features/records/RecordsListPage").then((m) => ({ default: m.RecordsListPage })));
const PurchaseOrderDetailPage = lazy(() => import("@/features/procurement/PurchaseOrderDetailPage").then((m) => ({ default: m.PurchaseOrderDetailPage })));
const PurchaseOrderFormPage = lazy(() => import("@/features/procurement/PurchaseOrderFormPage").then((m) => ({ default: m.PurchaseOrderFormPage })));
const PurchaseOrderItemFormPage = lazy(() => import("@/features/procurement/PurchaseOrderItemFormPage").then((m) => ({ default: m.PurchaseOrderItemFormPage })));
const PurchaseOrderItemsListPage = lazy(() => import("@/features/procurement/PurchaseOrderItemsListPage").then((m) => ({ default: m.PurchaseOrderItemsListPage })));
const PurchaseOrderReceiptPage = lazy(() => import("@/features/procurement/PurchaseOrderReceiptPage").then((m) => ({ default: m.PurchaseOrderReceiptPage })));
const PurchaseOrdersListPage = lazy(() => import("@/features/procurement/PurchaseOrdersListPage").then((m) => ({ default: m.PurchaseOrdersListPage })));
const PurchaseRequestDetailPage = lazy(() => import("@/features/procurement/PurchaseRequestDetailPage").then((m) => ({ default: m.PurchaseRequestDetailPage })));
const PurchaseRequestFormPage = lazy(() => import("@/features/procurement/PurchaseRequestFormPage").then((m) => ({ default: m.PurchaseRequestFormPage })));
const PurchaseRequestItemFormPage = lazy(() => import("@/features/procurement/PurchaseRequestItemFormPage").then((m) => ({ default: m.PurchaseRequestItemFormPage })));
const PurchaseRequestItemsListPage = lazy(() => import("@/features/procurement/PurchaseRequestItemsListPage").then((m) => ({ default: m.PurchaseRequestItemsListPage })));
const PurchaseRequestRejectFormPage = lazy(() => import("@/features/procurement/PurchaseRequestRejectFormPage").then((m) => ({ default: m.PurchaseRequestRejectFormPage })));
const PurchaseRequestsListPage = lazy(() => import("@/features/procurement/PurchaseRequestsListPage").then((m) => ({ default: m.PurchaseRequestsListPage })));
const AcademicPerformanceReportPage = lazy(() => import("@/features/reports/AcademicPerformanceReportPage").then((m) => ({ default: m.AcademicPerformanceReportPage })));
const AttendanceReportPage = lazy(() => import("@/features/reports/AttendanceReportPage").then((m) => ({ default: m.AttendanceReportPage })));
const EnrollmentReportPage = lazy(() => import("@/features/reports/EnrollmentReportPage").then((m) => ({ default: m.EnrollmentReportPage })));
const FinanceReportPage = lazy(() => import("@/features/reports/FinanceReportPage").then((m) => ({ default: m.FinanceReportPage })));
const ReportsLayout = lazy(() => import("@/features/reports/ReportsLayout").then((m) => ({ default: m.ReportsLayout })));
const ReceiveOrderFormPage = lazy(() => import("@/features/procurement/ReceiveOrderFormPage").then((m) => ({ default: m.ReceiveOrderFormPage })));
const SupplierFormPage = lazy(() => import("@/features/procurement/SupplierFormPage").then((m) => ({ default: m.SupplierFormPage })));
const SuppliersListPage = lazy(() => import("@/features/procurement/SuppliersListPage").then((m) => ({ default: m.SuppliersListPage })));
const SchoolDetailPage = lazy(() => import("@/features/schools/SchoolDetailPage").then((m) => ({ default: m.SchoolDetailPage })));
const SchoolFormPage = lazy(() => import("@/features/schools/SchoolFormPage").then((m) => ({ default: m.SchoolFormPage })));
const SchoolSuspendFormPage = lazy(() => import("@/features/schools/SchoolSuspendFormPage").then((m) => ({ default: m.SchoolSuspendFormPage })));
const SchoolsListPage = lazy(() => import("@/features/schools/SchoolsListPage").then((m) => ({ default: m.SchoolsListPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StaffDetailPage = lazy(() => import("@/features/staff/StaffDetailPage").then((m) => ({ default: m.StaffDetailPage })));
const StaffEditPage = lazy(() => import("@/features/staff/StaffEditPage").then((m) => ({ default: m.StaffEditPage })));
const StaffFormPage = lazy(() => import("@/features/staff/StaffFormPage").then((m) => ({ default: m.StaffFormPage })));
const StaffListPage = lazy(() => import("@/features/staff/StaffListPage").then((m) => ({ default: m.StaffListPage })));
const StudentDetailPage = lazy(() => import("@/features/students/StudentDetailPage").then((m) => ({ default: m.StudentDetailPage })));
const StudentFormPage = lazy(() => import("@/features/students/StudentFormPage").then((m) => ({ default: m.StudentFormPage })));
const StudentsListPage = lazy(() => import("@/features/students/StudentsListPage").then((m) => ({ default: m.StudentsListPage })));
const PeriodFormPage = lazy(() => import("@/features/timetable/PeriodFormPage").then((m) => ({ default: m.PeriodFormPage })));
const PeriodsListPage = lazy(() => import("@/features/timetable/PeriodsListPage").then((m) => ({ default: m.PeriodsListPage })));
const RoomFormPage = lazy(() => import("@/features/timetable/RoomFormPage").then((m) => ({ default: m.RoomFormPage })));
const RoomsListPage = lazy(() => import("@/features/timetable/RoomsListPage").then((m) => ({ default: m.RoomsListPage })));
const TimetableEntryFormPage = lazy(() => import("@/features/timetable/TimetableEntryFormPage").then((m) => ({ default: m.TimetableEntryFormPage })));
const TimetableGridPage = lazy(() => import("@/features/timetable/TimetableGridPage").then((m) => ({ default: m.TimetableGridPage })));
const TimetableLayout = lazy(() => import("@/features/timetable/TimetableLayout").then((m) => ({ default: m.TimetableLayout })));
const AssignmentFormPage = lazy(() => import("@/features/transport/AssignmentFormPage").then((m) => ({ default: m.AssignmentFormPage })));
const AssignmentsListPage = lazy(() => import("@/features/transport/AssignmentsListPage").then((m) => ({ default: m.AssignmentsListPage })));
const RouteFormPage = lazy(() => import("@/features/transport/RouteFormPage").then((m) => ({ default: m.RouteFormPage })));
const RoutesListPage = lazy(() => import("@/features/transport/RoutesListPage").then((m) => ({ default: m.RoutesListPage })));
const StopFormPage = lazy(() => import("@/features/transport/StopFormPage").then((m) => ({ default: m.StopFormPage })));
const StopsListPage = lazy(() => import("@/features/transport/StopsListPage").then((m) => ({ default: m.StopsListPage })));
const TransportLayout = lazy(() => import("@/features/transport/TransportLayout").then((m) => ({ default: m.TransportLayout })));
const VehicleFormPage = lazy(() => import("@/features/transport/VehicleFormPage").then((m) => ({ default: m.VehicleFormPage })));
const VehicleMaintenanceFormPage = lazy(() => import("@/features/transport/VehicleMaintenanceFormPage").then((m) => ({ default: m.VehicleMaintenanceFormPage })));
const VehicleMaintenanceListPage = lazy(() => import("@/features/transport/VehicleMaintenanceListPage").then((m) => ({ default: m.VehicleMaintenanceListPage })));
const VehiclesListPage = lazy(() => import("@/features/transport/VehiclesListPage").then((m) => ({ default: m.VehiclesListPage })));
const ForcedPasswordChangePage = lazy(() => import("@/features/auth/ForcedPasswordChangePage").then((m) => ({ default: m.ForcedPasswordChangePage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:slug" element={<BrandedLoginPage />} />
        <Route path="/two-factor" element={<TwoFactorPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/apply/:schoolSlug" element={<PublicApplyPage />} />
        <Route path="/verify-card/:token" element={<PublicVerifyCardPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/my-quizzes/:quizId/take" element={<TakeQuizPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/change-password" element={<ForcedPasswordChangePage />} />
        </Route>

        <Route element={<AccountLayout />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsListPage />} />
        </Route>

        <Route element={<PlatformShell />}>
          <Route path="/platform" element={<Navigate to="/platform/overview" replace />} />
          <Route path="/platform/overview" element={<PlatformOverviewPage />} />
          <Route path="/platform/schools" element={<SchoolsListPage />} />
          <Route path="/platform/schools/new" element={<SchoolFormPage />} />
          <Route path="/platform/schools/:id" element={<SchoolDetailPage />} />
          <Route path="/platform/schools/:id/edit" element={<SchoolFormPage />} />
          <Route path="/platform/schools/:id/suspend" element={<SchoolSuspendFormPage />} />
          <Route path="/platform/admins" element={<PlatformAdminsListPage />} />
          <Route path="/platform/admins/new" element={<InvitePlatformAdminFormPage />} />
        </Route>

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsListPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/students/:id/edit" element={<StudentFormPage />} />

          <Route path="/staff" element={<StaffListPage />} />
          <Route path="/staff/new" element={<StaffFormPage />} />
          <Route path="/staff/:id" element={<StaffDetailPage />} />
          <Route path="/staff/:id/edit" element={<StaffEditPage />} />

          <Route path="/discipline" element={<IncidentsListPage />} />
          <Route path="/discipline/new" element={<IncidentFormPage />} />
          <Route path="/discipline/:id/edit" element={<IncidentFormPage />} />

          <Route path="/parents" element={<GuardiansListPage />} />
          <Route path="/parents/new" element={<GuardianFormPage />} />
          <Route path="/parents/:id/edit" element={<GuardianFormPage />} />

          <Route path="/audit" element={<AuditLogsListPage />} />
          <Route path="/audit/:id" element={<AuditLogDetailPage />} />
          <Route path="/notifications/:id" element={<NotificationDetailPage />} />
          <Route path="/meetings" element={<MeetingsListPage />} />
          <Route path="/meetings/new" element={<MeetingFormPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/meetings/:id/room" element={<MeetingRoomPage />} />
          <Route path="/my-meetings" element={<MyMeetingsPage />} />
          <Route path="/idcards" element={<IdCardsPage />} />
          <Route path="/my-id-card" element={<MyIdCardPage />} />
          <Route path="/admissions/applications" element={<ApplicationsListPage />} />
          <Route path="/admissions/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/admissions/form" element={<ApplicationFormBuilderPage />} />
          <Route path="/roles" element={<RolesListPage />} />
          <Route path="/roles/new" element={<RoleFormPage />} />
          <Route path="/roles/:id" element={<RoleDetailPage />} />
          <Route path="/permissions" element={<PermissionsListPage />} />
          <Route path="/permissions/new" element={<PermissionFormPage />} />

          <Route path="/reports" element={<ReportsLayout />}>
            <Route index element={<Navigate to="enrollment" replace />} />
            <Route path="enrollment" element={<EnrollmentReportPage />} />
            <Route path="attendance" element={<AttendanceReportPage />} />
            <Route path="academic-performance" element={<AcademicPerformanceReportPage />} />
            <Route path="finance" element={<FinanceReportPage />} />
          </Route>

          <Route path="/communications" element={<AnnouncementsListPage />} />
          <Route path="/communications/new" element={<AnnouncementFormPage />} />
          <Route path="/communications/:id/edit" element={<AnnouncementFormPage />} />
          <Route path="/communications/:announcementId/recipients" element={<RecipientsListPage />} />
          <Route path="/communications/:announcementId/recipients/new" element={<RecipientFormPage />} />

          <Route path="/assignments" element={<HomeworkAssignmentsListPage />} />
          <Route path="/assignments/new" element={<HomeworkAssignmentFormPage />} />
          <Route path="/assignments/:id/edit" element={<HomeworkAssignmentFormPage />} />
          <Route path="/assignments/:assignmentId/submissions" element={<SubmissionsListPage />} />
          <Route
            path="/assignments/:assignmentId/submissions/:id/grade"
            element={<GradeSubmissionFormPage />}
          />

          <Route path="/documents" element={<DocumentsLayout />}>
            <Route index element={<Navigate to="files" replace />} />
            <Route path="files" element={<DocumentsListPage />} />
            <Route path="files/new" element={<DocumentFormPage />} />
            <Route path="files/:id/edit" element={<DocumentFormPage />} />
            <Route path="categories" element={<DocumentCategoriesListPage />} />
            <Route path="categories/new" element={<DocumentCategoryFormPage />} />
            <Route path="categories/:id/edit" element={<DocumentCategoryFormPage />} />
          </Route>

          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EventFormPage />} />

          <Route path="/complaints" element={<ComplaintsListPage />} />
          <Route path="/complaints/new" element={<ComplaintFormPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

          <Route path="/records" element={<RecordsListPage />} />
          <Route path="/records/new" element={<RecordFormPage />} />
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route path="/records/:id/edit" element={<RecordFormPage />} />

          <Route path="/transcript" element={<TranscriptPage />} />
          <Route path="/my-discipline" element={<MyDisciplinePage />} />
          <Route path="/my-medical" element={<MyMedicalPage />} />
          <Route path="/my-transport" element={<MyTransportPage />} />
          <Route path="/my-timetable" element={<MyTimetablePage />} />
          <Route path="/my-documents" element={<MyDocumentsPage />} />
          <Route path="/subjects" element={<TeacherSubjectsPage />} />
          <Route path="/subjects/:id/lessons" element={<TeacherSubjectLessonsPage />} />
          <Route path="/my-subjects" element={<MySubjectsPage />} />
          <Route path="/my-subjects/:id/ca" element={<MySubjectCAPage />} />
          <Route path="/my-subjects/:id/lessons" element={<MySubjectLessonsPage />} />
          <Route path="/my-subjects/:id/communications" element={<MySubjectCommunicationsPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/my-results/:schoolClassId/:termId" element={<MyResultDetailPage />} />
          <Route path="/my-graduation-status" element={<MyGraduationStatusPage />} />
          <Route path="/my-attendance" element={<MyAttendancePage />} />
          <Route path="/my-staff-attendance" element={<MyStaffAttendancePage />} />

          <Route path="/education/lessons" element={<LessonsListPage />} />
          <Route path="/education/lessons/new" element={<LessonFormPage />} />
          <Route path="/education/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/education/lessons/:id/edit" element={<LessonFormPage />} />
          <Route path="/my-lessons" element={<MyLessonsPage />} />

          <Route path="/live-sessions" element={<LiveSessionsListPage />} />
          <Route path="/live-sessions/new" element={<LiveSessionFormPage />} />
          <Route path="/live-sessions/:id/room" element={<LiveSessionRoomPage />} />
          <Route path="/my-live-sessions" element={<MyLiveSessionsPage />} />

          <Route path="/my-quizzes" element={<MyQuizzesPage />} />
          <Route path="/quizzes/:quizId/results" element={<QuizResultsPage />} />

          <Route path="/inventory" element={<InventoryLayout />}>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="items" element={<InventoryItemsListPage />} />
            <Route path="items/new" element={<InventoryItemFormPage />} />
            <Route path="items/:id/edit" element={<InventoryItemFormPage />} />
            <Route path="items/:id/stock-in" element={<StockAdjustmentFormPage />} />
            <Route path="items/:id/stock-out" element={<StockAdjustmentFormPage />} />
            <Route path="categories" element={<InventoryCategoriesListPage />} />
            <Route path="categories/new" element={<InventoryCategoryFormPage />} />
            <Route path="categories/:id/edit" element={<InventoryCategoryFormPage />} />
            <Route path="transactions" element={<InventoryTransactionsListPage />} />
          </Route>

          <Route path="/procurement" element={<ProcurementLayout />}>
            <Route index element={<Navigate to="requests" replace />} />
            <Route path="requests" element={<PurchaseRequestsListPage />} />
            <Route path="requests/new" element={<PurchaseRequestFormPage />} />
            <Route path="requests/:id" element={<PurchaseRequestDetailPage />} />
            <Route path="requests/:id/edit" element={<PurchaseRequestFormPage />} />
            <Route path="requests/:id/reject" element={<PurchaseRequestRejectFormPage />} />
            <Route path="requests/:id/items" element={<PurchaseRequestItemsListPage />} />
            <Route path="requests/:id/items/new" element={<PurchaseRequestItemFormPage />} />
            <Route path="requests/:id/items/:itemId/edit" element={<PurchaseRequestItemFormPage />} />
            <Route path="orders" element={<PurchaseOrdersListPage />} />
            <Route path="orders/new" element={<PurchaseOrderFormPage />} />
            <Route path="orders/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="orders/:id/edit" element={<PurchaseOrderFormPage />} />
            <Route path="orders/:id/receive" element={<ReceiveOrderFormPage />} />
            <Route path="orders/:id/receipt" element={<PurchaseOrderReceiptPage />} />
            <Route path="orders/:id/items" element={<PurchaseOrderItemsListPage />} />
            <Route path="orders/:id/items/new" element={<PurchaseOrderItemFormPage />} />
            <Route path="orders/:id/items/:itemId/edit" element={<PurchaseOrderItemFormPage />} />
            <Route path="suppliers" element={<SuppliersListPage />} />
            <Route path="suppliers/new" element={<SupplierFormPage />} />
            <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />
          </Route>

          <Route path="/academics" element={<AcademicsLayout />}>
            <Route index element={<Navigate to="years" replace />} />
            <Route path="years" element={<AcademicYearsListPage />} />
            <Route path="years/new" element={<AcademicYearFormPage />} />
            <Route path="years/:id/edit" element={<AcademicYearFormPage />} />
            <Route path="terms" element={<TermsListPage />} />
            <Route path="terms/new" element={<TermFormPage />} />
            <Route path="terms/:id/edit" element={<TermFormPage />} />
            <Route path="departments" element={<DepartmentsListPage />} />
            <Route path="departments/new" element={<DepartmentFormPage />} />
            <Route path="departments/:id/edit" element={<DepartmentFormPage />} />
            <Route path="subjects" element={<SubjectsListPage />} />
            <Route path="subjects/new" element={<SubjectFormPage />} />
            <Route path="subjects/:id/edit" element={<SubjectFormPage />} />
            <Route path="subject-offerings" element={<SubjectOfferingsListPage />} />
            <Route path="subject-offerings/new" element={<SubjectOfferingFormPage />} />
            <Route path="subject-offerings/:id/edit" element={<SubjectOfferingFormPage />} />
            <Route path="subject-offerings/:id/students" element={<SubjectOfferingRosterPage />} />
            <Route
              path="subject-offerings/:id/students/:studentId/messages"
              element={<TeacherSubjectPrivateThreadPage />}
            />
            <Route path="subject-offerings/:id/ca" element={<SubjectOfferingCAPage />} />
            <Route path="subject-offerings/:id/quizzes" element={<SubjectOfferingQuizzesPage />} />
            <Route path="subject-offerings/:id/results" element={<SubjectResultsPage />} />
            <Route
              path="subject-offerings/:id/communications"
              element={<SubjectOfferingCommunicationsPage />}
            />
            <Route path="assessments/:id/scores" element={<AssessmentGradeEntryPage />} />
            <Route path="classes" element={<SchoolClassesListPage />} />
            <Route path="classes/new" element={<SchoolClassFormPage />} />
            <Route path="classes/:id/edit" element={<SchoolClassFormPage />} />
            <Route path="classes/:id/results" element={<ClassResultsPage />} />
            <Route
              path="results/:studentId/:schoolClassId/:termId"
              element={<StudentTermReportPage />}
            />
            <Route path="students/:id/graduation-status" element={<StudentGraduationStatusPage />} />
            <Route path="sections" element={<SectionsListPage />} />
            <Route path="sections/new" element={<SectionFormPage />} />
            <Route path="sections/:id/edit" element={<SectionFormPage />} />
          </Route>

          <Route path="/timetable" element={<TimetableLayout />}>
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<TimetableGridPage />} />
            <Route path="build" element={<BuildTimetablePage />} />
            <Route path="entries/new" element={<TimetableEntryFormPage />} />
            <Route path="entries/:id/edit" element={<TimetableEntryFormPage />} />
            <Route path="periods" element={<PeriodsListPage />} />
            <Route path="periods/new" element={<PeriodFormPage />} />
            <Route path="periods/:id/edit" element={<PeriodFormPage />} />
            <Route path="rooms" element={<RoomsListPage />} />
            <Route path="rooms/new" element={<RoomFormPage />} />
            <Route path="rooms/:id/edit" element={<RoomFormPage />} />
          </Route>

          <Route path="/attendance" element={<AttendanceLayout />}>
            <Route index element={<AttendanceIndexRedirect />} />
            <Route path="take" element={<TakeAttendancePage />} />
            <Route path="records" element={<AttendanceRecordsPage />} />
            <Route path="records/new" element={<AttendanceRecordFormPage />} />
            <Route path="records/:id/edit" element={<AttendanceRecordFormPage />} />
            <Route path="stats" element={<AttendanceStatsPage />} />
            <Route path="staff" element={<StaffAttendanceListPage />} />
            <Route path="staff/new" element={<StaffAttendanceFormPage />} />
            <Route path="staff/:id/edit" element={<StaffAttendanceFormPage />} />
          </Route>

          <Route path="/examinations" element={<ExaminationsLayout />}>
            <Route index element={<ExaminationsIndexRedirect />} />
            <Route path="exams" element={<ExamsListPage />} />
            <Route path="exams/new" element={<ExamFormPage />} />
            <Route path="exams/:id/edit" element={<ExamFormPage />} />
            <Route path="exams/:examId/schedules" element={<ExamSchedulesListPage />} />
            <Route path="exams/:examId/schedules/new" element={<ExamScheduleFormPage />} />
            <Route path="exams/:examId/schedules/:id/edit" element={<ExamScheduleFormPage />} />
            <Route path="scales" element={<GradingScalesListPage />} />
            <Route path="scales/new" element={<GradingScaleFormPage />} />
            <Route path="scales/:id/edit" element={<GradingScaleFormPage />} />
            <Route path="scales/:scaleId/boundaries" element={<GradeBoundariesListPage />} />
            <Route path="scales/:scaleId/boundaries/new" element={<GradeBoundaryFormPage />} />
            <Route path="scales/:scaleId/boundaries/:id/edit" element={<GradeBoundaryFormPage />} />
          </Route>

          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<FinanceIndexRedirect />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="invoices/new" element={<InvoiceFormPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="invoices/:invoiceId/pay" element={<PaymentFormPage />} />
            <Route path="invoices/:invoiceId/line-items" element={<InvoiceLineItemsListPage />} />
            <Route path="invoices/:invoiceId/line-items/new" element={<InvoiceLineItemFormPage />} />
            <Route path="invoices/:invoiceId/line-items/:id/edit" element={<InvoiceLineItemFormPage />} />
            <Route path="generate" element={<GenerateInvoicesPage />} />
            <Route path="payments" element={<PaymentsListPage />} />
            <Route path="payments/:id/refund" element={<RefundFormPage />} />
            <Route path="payments/:id/receipt" element={<PaymentReceiptPage />} />
            <Route path="structures" element={<FeeStructuresListPage />} />
            <Route path="structures/new" element={<FeeStructureFormPage />} />
            <Route path="structures/:id/edit" element={<FeeStructureFormPage />} />
            <Route path="structures/:structureId/items" element={<FeeStructureItemsListPage />} />
            <Route path="structures/:structureId/items/new" element={<FeeStructureItemFormPage />} />
            <Route path="structures/:structureId/items/:id/edit" element={<FeeStructureItemFormPage />} />
            <Route path="categories" element={<FeeCategoriesListPage />} />
            <Route path="categories/new" element={<FeeCategoryFormPage />} />
            <Route path="categories/:id/edit" element={<FeeCategoryFormPage />} />
            <Route path="stats" element={<FinanceStatsPage />} />
          </Route>

          <Route path="/salary" element={<SalaryLayout />}>
            <Route index element={<SalaryIndexRedirect />} />
            <Route path="payments" element={<SalaryPaymentsListPage />} />
            <Route path="payments/:id/pay" element={<PaySalaryPaymentPage />} />
            <Route path="payments/:id/receipt" element={<SalaryPaymentReceiptPage />} />
            <Route path="generate" element={<GenerateSalaryPaymentsPage />} />
            <Route path="structures" element={<SalaryStructuresListPage />} />
            <Route path="structures/new" element={<SalaryStructureFormPage />} />
            <Route path="structures/:id/edit" element={<SalaryStructureFormPage />} />
            <Route path="structures/:structureId/items" element={<SalaryStructureItemsListPage />} />
            <Route path="structures/:structureId/items/new" element={<SalaryStructureItemFormPage />} />
            <Route path="structures/:structureId/items/:id/edit" element={<SalaryStructureItemFormPage />} />
            <Route path="assignments" element={<StaffSalaryAssignmentsListPage />} />
            <Route path="assignments/new" element={<StaffSalaryAssignmentFormPage />} />
            <Route path="assignments/:id/edit" element={<StaffSalaryAssignmentFormPage />} />
          </Route>

          <Route path="/hostel" element={<HostelLayout />}>
            <Route index element={<Navigate to="hostels" replace />} />
            <Route path="hostels" element={<HostelsListPage />} />
            <Route path="hostels/new" element={<HostelFormPage />} />
            <Route path="hostels/:id/edit" element={<HostelFormPage />} />
            <Route path="hostels/:hostelId/rooms" element={<HostelRoomsListPage />} />
            <Route path="hostels/:hostelId/rooms/new" element={<HostelRoomFormPage />} />
            <Route path="hostels/:hostelId/rooms/:id/edit" element={<HostelRoomFormPage />} />
            <Route path="hostels/:hostelId/rooms/:roomId/beds" element={<BedsListPage />} />
            <Route path="hostels/:hostelId/rooms/:roomId/beds/new" element={<BedFormPage />} />
            <Route path="hostels/:hostelId/rooms/:roomId/beds/:id/edit" element={<BedFormPage />} />
            <Route path="allocations" element={<AllocationsListPage />} />
            <Route path="allocations/new" element={<AllocationFormPage />} />
          </Route>

          <Route path="/library" element={<LibraryLayout />}>
            <Route index element={<Navigate to="checkout" replace />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="loans" element={<LoansListPage />} />
            <Route path="reservations" element={<ReservationsListPage />} />
            <Route path="reservations/new" element={<ReservationFormPage />} />
            <Route path="books" element={<BooksListPage />} />
            <Route path="books/new" element={<BookFormPage />} />
            <Route path="books/:id/edit" element={<BookFormPage />} />
            <Route path="books/:bookId/copies" element={<BookCopiesListPage />} />
            <Route path="books/:bookId/copies/new" element={<BookCopyFormPage />} />
            <Route path="books/:bookId/copies/:id/edit" element={<BookCopyFormPage />} />
            <Route path="categories" element={<CategoriesListPage />} />
            <Route path="categories/new" element={<CategoryFormPage />} />
            <Route path="categories/:id/edit" element={<CategoryFormPage />} />
          </Route>

          <Route path="/medical" element={<MedicalLayout />}>
            <Route index element={<Navigate to="profiles" replace />} />
            <Route path="profiles" element={<ProfilesListPage />} />
            <Route path="profiles/new" element={<ProfileFormPage />} />
            <Route path="profiles/:id/edit" element={<ProfileFormPage />} />
            <Route path="visits" element={<VisitsListPage />} />
            <Route path="visits/new" element={<VisitFormPage />} />
            <Route path="visits/:id/edit" element={<VisitFormPage />} />
          </Route>

          <Route path="/transport" element={<TransportLayout />}>
            <Route index element={<Navigate to="vehicles" replace />} />
            <Route path="vehicles" element={<VehiclesListPage />} />
            <Route path="vehicles/new" element={<VehicleFormPage />} />
            <Route path="vehicles/:id/edit" element={<VehicleFormPage />} />
            <Route path="vehicles/:vehicleId/maintenance" element={<VehicleMaintenanceListPage />} />
            <Route path="vehicles/:vehicleId/maintenance/new" element={<VehicleMaintenanceFormPage />} />
            <Route path="vehicles/:vehicleId/maintenance/:id/edit" element={<VehicleMaintenanceFormPage />} />
            <Route path="routes" element={<RoutesListPage />} />
            <Route path="routes/new" element={<RouteFormPage />} />
            <Route path="routes/:id/edit" element={<RouteFormPage />} />
            <Route path="routes/:routeId/stops" element={<StopsListPage />} />
            <Route path="routes/:routeId/stops/new" element={<StopFormPage />} />
            <Route path="routes/:routeId/stops/:id/edit" element={<StopFormPage />} />
            <Route path="assignments" element={<AssignmentsListPage />} />
            <Route path="assignments/new" element={<AssignmentFormPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
