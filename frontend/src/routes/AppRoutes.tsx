import { Navigate, Route, Routes } from "react-router-dom";

import { AcademicYearFormPage } from "@/features/academics/AcademicYearFormPage";
import { AcademicYearsListPage } from "@/features/academics/AcademicYearsListPage";
import { AcademicsLayout } from "@/features/academics/AcademicsLayout";
import { DepartmentFormPage } from "@/features/academics/DepartmentFormPage";
import { DepartmentsListPage } from "@/features/academics/DepartmentsListPage";
import { SchoolClassFormPage } from "@/features/academics/SchoolClassFormPage";
import { ClassResultsPage } from "@/features/academics/ClassResultsPage";
import { StudentGraduationStatusPage } from "@/features/academics/StudentGraduationStatusPage";
import { StudentTermReportPage } from "@/features/academics/StudentTermReportPage";
import { SchoolClassesListPage } from "@/features/academics/SchoolClassesListPage";
import { SectionFormPage } from "@/features/academics/SectionFormPage";
import { SectionsListPage } from "@/features/academics/SectionsListPage";
import { SubjectFormPage } from "@/features/academics/SubjectFormPage";
import { SubjectsListPage } from "@/features/academics/SubjectsListPage";
import { AssessmentGradeEntryPage } from "@/features/academics/AssessmentGradeEntryPage";
import { MySubjectCAPage } from "@/features/academics/MySubjectCAPage";
import { MySubjectCommunicationsPage } from "@/features/academics/MySubjectCommunicationsPage";
import { MyResultDetailPage } from "@/features/academics/MyResultDetailPage";
import { MyGraduationStatusPage } from "@/features/academics/MyGraduationStatusPage";
import { MyResultsPage } from "@/features/academics/MyResultsPage";
import { TeacherSubjectLessonsPage } from "@/features/academics/TeacherSubjectLessonsPage";
import { TeacherSubjectsPage } from "@/features/academics/TeacherSubjectsPage";
import { MySubjectsPage } from "@/features/academics/MySubjectsPage";
import { SubjectOfferingCAPage } from "@/features/academics/SubjectOfferingCAPage";
import { SubjectOfferingCommunicationsPage } from "@/features/academics/SubjectOfferingCommunicationsPage";
import { TeacherSubjectPrivateThreadPage } from "@/features/academics/TeacherSubjectPrivateThreadPage";
import { SubjectResultsPage } from "@/features/academics/SubjectResultsPage";
import { SubjectOfferingFormPage } from "@/features/academics/SubjectOfferingFormPage";
import { SubjectOfferingRosterPage } from "@/features/academics/SubjectOfferingRosterPage";
import { SubjectOfferingsListPage } from "@/features/academics/SubjectOfferingsListPage";
import { TermFormPage } from "@/features/academics/TermFormPage";
import { TermsListPage } from "@/features/academics/TermsListPage";
import { GradeSubmissionFormPage } from "@/features/assignments/GradeSubmissionFormPage";
import { HomeworkAssignmentFormPage } from "@/features/assignments/HomeworkAssignmentFormPage";
import { HomeworkAssignmentsListPage } from "@/features/assignments/HomeworkAssignmentsListPage";
import { SubmissionsListPage } from "@/features/assignments/SubmissionsListPage";
import { AttendanceIndexRedirect } from "@/features/attendance/AttendanceIndexRedirect";
import { AttendanceLayout } from "@/features/attendance/AttendanceLayout";
import { AttendanceRecordFormPage } from "@/features/attendance/AttendanceRecordFormPage";
import { AttendanceRecordsPage } from "@/features/attendance/AttendanceRecordsPage";
import { AttendanceStatsPage } from "@/features/attendance/AttendanceStatsPage";
import { StaffAttendanceFormPage } from "@/features/attendance/StaffAttendanceFormPage";
import { StaffAttendanceListPage } from "@/features/attendance/StaffAttendanceListPage";
import { TakeAttendancePage } from "@/features/attendance/TakeAttendancePage";
import { AuditLogDetailPage } from "@/features/audit/AuditLogDetailPage";
import { AuditLogsListPage } from "@/features/audit/AuditLogsListPage";
import { BrandedLoginPage } from "@/features/auth/BrandedLoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { TwoFactorPage } from "@/features/auth/TwoFactorPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { AnnouncementFormPage } from "@/features/communications/AnnouncementFormPage";
import { AnnouncementsListPage } from "@/features/communications/AnnouncementsListPage";
import { RecipientFormPage } from "@/features/communications/RecipientFormPage";
import { RecipientsListPage } from "@/features/communications/RecipientsListPage";
import { ComplaintDetailPage } from "@/features/complaints/ComplaintDetailPage";
import { ComplaintFormPage } from "@/features/complaints/ComplaintFormPage";
import { ComplaintsListPage } from "@/features/complaints/ComplaintsListPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { IncidentFormPage } from "@/features/discipline/IncidentFormPage";
import { IncidentsListPage } from "@/features/discipline/IncidentsListPage";
import { CategoriesListPage as DocumentCategoriesListPage } from "@/features/documents/CategoriesListPage";
import { CategoryFormPage as DocumentCategoryFormPage } from "@/features/documents/CategoryFormPage";
import { DocumentFormPage } from "@/features/documents/DocumentFormPage";
import { DocumentsLayout } from "@/features/documents/DocumentsLayout";
import { DocumentsListPage } from "@/features/documents/DocumentsListPage";
import { LessonDetailPage } from "@/features/education/LessonDetailPage";
import { LessonFormPage } from "@/features/education/LessonFormPage";
import { LessonsListPage } from "@/features/education/LessonsListPage";
import { MyLessonsPage } from "@/features/education/MyLessonsPage";
import { MyDisciplinePage } from "@/features/discipline/MyDisciplinePage";
import { MyMedicalPage } from "@/features/medical/MyMedicalPage";
import { MyTransportPage } from "@/features/transport/MyTransportPage";
import { MyTimetablePage } from "@/features/timetable/MyTimetablePage";
import { MyDocumentsPage } from "@/features/documents/MyDocumentsPage";
import { EventDetailPage } from "@/features/events/EventDetailPage";
import { EventFormPage } from "@/features/events/EventFormPage";
import { EventsListPage } from "@/features/events/EventsListPage";
import { EnterMarksPage } from "@/features/examinations/EnterMarksPage";
import { ExamFormPage } from "@/features/examinations/ExamFormPage";
import { ExaminationsIndexRedirect } from "@/features/examinations/ExaminationsIndexRedirect";
import { ExaminationsLayout } from "@/features/examinations/ExaminationsLayout";
import { ExamSchedulesListPage } from "@/features/examinations/ExamSchedulesListPage";
import { ExamScheduleFormPage } from "@/features/examinations/ExamScheduleFormPage";
import { ExamsListPage } from "@/features/examinations/ExamsListPage";
import { GradeBoundariesListPage } from "@/features/examinations/GradeBoundariesListPage";
import { GradeBoundaryFormPage } from "@/features/examinations/GradeBoundaryFormPage";
import { GradingScaleFormPage } from "@/features/examinations/GradingScaleFormPage";
import { GradingScalesListPage } from "@/features/examinations/GradingScalesListPage";
import { ReportCardPage } from "@/features/examinations/ReportCardPage";
import { ResultCorrectPage } from "@/features/examinations/ResultCorrectPage";
import { ResultEditPage } from "@/features/examinations/ResultEditPage";
import { ResultsListPage } from "@/features/examinations/ResultsListPage";
import { TranscriptPage } from "@/features/examinations/TranscriptPage";
import { FeeCategoriesListPage } from "@/features/finance/FeeCategoriesListPage";
import { FeeCategoryFormPage } from "@/features/finance/FeeCategoryFormPage";
import { FeeStructureFormPage } from "@/features/finance/FeeStructureFormPage";
import { FeeStructureItemFormPage } from "@/features/finance/FeeStructureItemFormPage";
import { FeeStructureItemsListPage } from "@/features/finance/FeeStructureItemsListPage";
import { FeeStructuresListPage } from "@/features/finance/FeeStructuresListPage";
import { FinanceIndexRedirect } from "@/features/finance/FinanceIndexRedirect";
import { FinanceLayout } from "@/features/finance/FinanceLayout";
import { FinanceStatsPage } from "@/features/finance/FinanceStatsPage";
import { GenerateInvoicesPage } from "@/features/finance/GenerateInvoicesPage";
import { InvoiceDetailPage } from "@/features/finance/InvoiceDetailPage";
import { InvoiceFormPage } from "@/features/finance/InvoiceFormPage";
import { InvoiceLineItemFormPage } from "@/features/finance/InvoiceLineItemFormPage";
import { InvoiceLineItemsListPage } from "@/features/finance/InvoiceLineItemsListPage";
import { InvoicesListPage } from "@/features/finance/InvoicesListPage";
import { PaymentFormPage } from "@/features/finance/PaymentFormPage";
import { PaymentReceiptPage } from "@/features/finance/PaymentReceiptPage";
import { PaymentsListPage } from "@/features/finance/PaymentsListPage";
import { RefundFormPage } from "@/features/finance/RefundFormPage";
import { GenerateSalaryPaymentsPage } from "@/features/salary/GenerateSalaryPaymentsPage";
import { PaySalaryPaymentPage } from "@/features/salary/PaySalaryPaymentPage";
import { SalaryIndexRedirect } from "@/features/salary/SalaryIndexRedirect";
import { SalaryLayout } from "@/features/salary/SalaryLayout";
import { SalaryPaymentReceiptPage } from "@/features/salary/SalaryPaymentReceiptPage";
import { SalaryPaymentsListPage } from "@/features/salary/SalaryPaymentsListPage";
import { SalaryStructureFormPage } from "@/features/salary/SalaryStructureFormPage";
import { SalaryStructureItemFormPage } from "@/features/salary/SalaryStructureItemFormPage";
import { SalaryStructureItemsListPage } from "@/features/salary/SalaryStructureItemsListPage";
import { SalaryStructuresListPage } from "@/features/salary/SalaryStructuresListPage";
import { StaffSalaryAssignmentFormPage } from "@/features/salary/StaffSalaryAssignmentFormPage";
import { StaffSalaryAssignmentsListPage } from "@/features/salary/StaffSalaryAssignmentsListPage";
import { AllocationFormPage } from "@/features/hostel/AllocationFormPage";
import { AllocationsListPage } from "@/features/hostel/AllocationsListPage";
import { BedFormPage } from "@/features/hostel/BedFormPage";
import { BedsListPage } from "@/features/hostel/BedsListPage";
import { HostelFormPage } from "@/features/hostel/HostelFormPage";
import { HostelLayout } from "@/features/hostel/HostelLayout";
import { HostelRoomFormPage } from "@/features/hostel/HostelRoomFormPage";
import { HostelRoomsListPage } from "@/features/hostel/HostelRoomsListPage";
import { HostelsListPage } from "@/features/hostel/HostelsListPage";
import { CategoriesListPage as InventoryCategoriesListPage } from "@/features/inventory/CategoriesListPage";
import { CategoryFormPage as InventoryCategoryFormPage } from "@/features/inventory/CategoryFormPage";
import { InventoryLayout } from "@/features/inventory/InventoryLayout";
import { ItemFormPage as InventoryItemFormPage } from "@/features/inventory/ItemFormPage";
import { ItemsListPage as InventoryItemsListPage } from "@/features/inventory/ItemsListPage";
import { StockAdjustmentFormPage } from "@/features/inventory/StockAdjustmentFormPage";
import { TransactionsListPage as InventoryTransactionsListPage } from "@/features/inventory/TransactionsListPage";
import { BookCopiesListPage } from "@/features/library/BookCopiesListPage";
import { BookCopyFormPage } from "@/features/library/BookCopyFormPage";
import { BookFormPage } from "@/features/library/BookFormPage";
import { BooksListPage } from "@/features/library/BooksListPage";
import { CategoriesListPage } from "@/features/library/CategoriesListPage";
import { CategoryFormPage } from "@/features/library/CategoryFormPage";
import { CheckoutPage } from "@/features/library/CheckoutPage";
import { LibraryLayout } from "@/features/library/LibraryLayout";
import { LoansListPage } from "@/features/library/LoansListPage";
import { ReservationFormPage } from "@/features/library/ReservationFormPage";
import { ReservationsListPage } from "@/features/library/ReservationsListPage";
import { LiveSessionFormPage } from "@/features/live-sessions/LiveSessionFormPage";
import { LiveSessionRoomPage } from "@/features/live-sessions/LiveSessionRoomPage";
import { LiveSessionsListPage } from "@/features/live-sessions/LiveSessionsListPage";
import { MyLiveSessionsPage } from "@/features/live-sessions/MyLiveSessionsPage";
import { MedicalLayout } from "@/features/medical/MedicalLayout";
import { ProfileFormPage } from "@/features/medical/ProfileFormPage";
import { ProfilesListPage } from "@/features/medical/ProfilesListPage";
import { VisitFormPage } from "@/features/medical/VisitFormPage";
import { VisitsListPage } from "@/features/medical/VisitsListPage";
import { NotificationsListPage } from "@/features/notifications/NotificationsListPage";
import { GuardianFormPage } from "@/features/parents/GuardianFormPage";
import { GuardiansListPage } from "@/features/parents/GuardiansListPage";
import { InvitePlatformAdminFormPage } from "@/features/platform/InvitePlatformAdminFormPage";
import { PlatformAdminsListPage } from "@/features/platform/PlatformAdminsListPage";
import { PlatformOverviewPage } from "@/features/platform/PlatformOverviewPage";
import { ProcurementLayout } from "@/features/procurement/ProcurementLayout";
import { RecordDetailPage } from "@/features/records/RecordDetailPage";
import { RecordFormPage } from "@/features/records/RecordFormPage";
import { RecordsListPage } from "@/features/records/RecordsListPage";
import { PurchaseOrderDetailPage } from "@/features/procurement/PurchaseOrderDetailPage";
import { PurchaseOrderFormPage } from "@/features/procurement/PurchaseOrderFormPage";
import { PurchaseOrderItemFormPage } from "@/features/procurement/PurchaseOrderItemFormPage";
import { PurchaseOrderItemsListPage } from "@/features/procurement/PurchaseOrderItemsListPage";
import { PurchaseOrderReceiptPage } from "@/features/procurement/PurchaseOrderReceiptPage";
import { PurchaseOrdersListPage } from "@/features/procurement/PurchaseOrdersListPage";
import { PurchaseRequestDetailPage } from "@/features/procurement/PurchaseRequestDetailPage";
import { PurchaseRequestFormPage } from "@/features/procurement/PurchaseRequestFormPage";
import { PurchaseRequestItemFormPage } from "@/features/procurement/PurchaseRequestItemFormPage";
import { PurchaseRequestItemsListPage } from "@/features/procurement/PurchaseRequestItemsListPage";
import { PurchaseRequestRejectFormPage } from "@/features/procurement/PurchaseRequestRejectFormPage";
import { PurchaseRequestsListPage } from "@/features/procurement/PurchaseRequestsListPage";
import { AcademicPerformanceReportPage } from "@/features/reports/AcademicPerformanceReportPage";
import { AttendanceReportPage } from "@/features/reports/AttendanceReportPage";
import { EnrollmentReportPage } from "@/features/reports/EnrollmentReportPage";
import { FinanceReportPage } from "@/features/reports/FinanceReportPage";
import { ReportsLayout } from "@/features/reports/ReportsLayout";
import { ReceiveOrderFormPage } from "@/features/procurement/ReceiveOrderFormPage";
import { SupplierFormPage } from "@/features/procurement/SupplierFormPage";
import { SuppliersListPage } from "@/features/procurement/SuppliersListPage";
import { SchoolDetailPage } from "@/features/schools/SchoolDetailPage";
import { SchoolFormPage } from "@/features/schools/SchoolFormPage";
import { SchoolSuspendFormPage } from "@/features/schools/SchoolSuspendFormPage";
import { SchoolsListPage } from "@/features/schools/SchoolsListPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { StaffDetailPage } from "@/features/staff/StaffDetailPage";
import { StaffEditPage } from "@/features/staff/StaffEditPage";
import { StaffFormPage } from "@/features/staff/StaffFormPage";
import { StaffListPage } from "@/features/staff/StaffListPage";
import { StudentDetailPage } from "@/features/students/StudentDetailPage";
import { StudentFormPage } from "@/features/students/StudentFormPage";
import { StudentsListPage } from "@/features/students/StudentsListPage";
import { PeriodFormPage } from "@/features/timetable/PeriodFormPage";
import { PeriodsListPage } from "@/features/timetable/PeriodsListPage";
import { RoomFormPage } from "@/features/timetable/RoomFormPage";
import { RoomsListPage } from "@/features/timetable/RoomsListPage";
import { TimetableEntryFormPage } from "@/features/timetable/TimetableEntryFormPage";
import { TimetableGridPage } from "@/features/timetable/TimetableGridPage";
import { TimetableLayout } from "@/features/timetable/TimetableLayout";
import { AssignmentFormPage } from "@/features/transport/AssignmentFormPage";
import { AssignmentsListPage } from "@/features/transport/AssignmentsListPage";
import { RouteFormPage } from "@/features/transport/RouteFormPage";
import { RoutesListPage } from "@/features/transport/RoutesListPage";
import { StopFormPage } from "@/features/transport/StopFormPage";
import { StopsListPage } from "@/features/transport/StopsListPage";
import { TransportLayout } from "@/features/transport/TransportLayout";
import { VehicleFormPage } from "@/features/transport/VehicleFormPage";
import { VehicleMaintenanceFormPage } from "@/features/transport/VehicleMaintenanceFormPage";
import { VehicleMaintenanceListPage } from "@/features/transport/VehicleMaintenanceListPage";
import { VehiclesListPage } from "@/features/transport/VehiclesListPage";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AppShell } from "@/layouts/AppShell";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PlatformShell } from "@/layouts/PlatformShell";

import { ForcedPasswordChangePage } from "@/features/auth/ForcedPasswordChangePage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:slug" element={<BrandedLoginPage />} />
        <Route path="/two-factor" element={<TwoFactorPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
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
          <Route path="/my-subjects/:id/communications" element={<MySubjectCommunicationsPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/my-results/:schoolClassId/:termId" element={<MyResultDetailPage />} />
          <Route path="/my-graduation-status" element={<MyGraduationStatusPage />} />

          <Route path="/education/lessons" element={<LessonsListPage />} />
          <Route path="/education/lessons/new" element={<LessonFormPage />} />
          <Route path="/education/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/education/lessons/:id/edit" element={<LessonFormPage />} />
          <Route path="/my-lessons" element={<MyLessonsPage />} />

          <Route path="/live-sessions" element={<LiveSessionsListPage />} />
          <Route path="/live-sessions/new" element={<LiveSessionFormPage />} />
          <Route path="/live-sessions/:id/room" element={<LiveSessionRoomPage />} />
          <Route path="/my-live-sessions" element={<MyLiveSessionsPage />} />

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
            <Route path="enter-marks" element={<EnterMarksPage />} />
            <Route path="results" element={<ResultsListPage />} />
            <Route path="results/:id/edit" element={<ResultEditPage />} />
            <Route path="results/:id/correct" element={<ResultCorrectPage />} />
            <Route path="report-card" element={<ReportCardPage />} />
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
  );
}
