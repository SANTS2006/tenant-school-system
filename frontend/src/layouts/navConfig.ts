import {
  Archive,
  Award,
  BarChart3,
  Banknote,
  BedDouble,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Contact,
  FileText,
  GraduationCap,
  HeartPulse,
  History,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageSquareWarning,
  NotebookText,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Users,
  Video,
  Wallet,
} from "lucide-react";

/** `selfServiceFor` gates a self-service item on account identity instead of (or in addition to)
 * a permission code — student portal accounts hold zero RBAC permissions, so an item like "My
 * Transcript" has no permission code to gate on at all. `"student"` shows only for accounts with
 * a linked `student_profile`; `"student-or-staff"` shows for either a student or a staff profile
 * (e.g. My Timetable/My Documents, whose backend views already serve both). See
 * `useAuth.ts::isNavItemVisible`, which is what actually applies this. */
export interface NavChild {
  to: string;
  label: string;
  permission?: string | string[];
  selfServiceFor?: "student" | "student-or-staff";
  hideForRoles?: string[];
  showForRoles?: string[];
}

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
  selfServiceFor?: "student" | "student-or-staff";
  /** See `isNavItemVisible` in useAuth.ts. */
  hideForRoles?: string[];
  showForRoles?: string[];
  children?: NavChild[];
}

/** The single source of truth for both the sidebar (AppShell.tsx) and the Dashboard's
 * "Modules available to you" panel — kept in its own module (not exported alongside the
 * AppShell component) so the two never drift out of sync and so this plain data export doesn't
 * trip the react-refresh only-export-components rule. */
export const NAV_CONFIG: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: GraduationCap, permission: "students.view" },
  { to: "/staff", label: "Staff", icon: Users, permission: "staff.view" },
  {
    to: "/academics",
    label: "Academics",
    icon: BookOpen,
    permission: "academics.view",
    // These roles keep `academics.view` only so dropdowns (classes, years, subjects) in their own
    // modules work; they have no Academics module of their own.
    hideForRoles: ["teacher", "accountant", "exams-director"],
    children: [
      { to: "/academics/years", label: "Academic years" },
      { to: "/academics/terms", label: "Terms" },
      { to: "/academics/departments", label: "Departments" },
      { to: "/academics/subjects", label: "Subjects" },
      { to: "/academics/subject-offerings", label: "Subject Offerings" },
      { to: "/academics/classes", label: "Classes" },
      { to: "/academics/sections", label: "Sections" },
    ],
  },
  { to: "/subjects", label: "Subjects", icon: BookOpen, permission: "academics.view", showForRoles: ["teacher"] },
  {
    to: "/timetable",
    label: "Timetable",
    icon: CalendarClock,
    permission: "timetable.view",
    children: [
      { to: "/timetable/schedule", label: "Schedule" },
      { to: "/timetable/periods", label: "Periods" },
      { to: "/timetable/rooms", label: "Rooms" },
    ],
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
    permission: ["attendance.view", "staff_attendance.view"],
    children: [
      { to: "/attendance/take", label: "Take attendance", permission: "attendance.create" },
      { to: "/attendance/records", label: "Records", permission: "attendance.view" },
      { to: "/attendance/stats", label: "Stats", permission: "attendance.view" },
      { to: "/attendance/staff", label: "Staff attendance", permission: "staff_attendance.view" },
    ],
  },
  {
    to: "/examinations",
    label: "Examinations",
    icon: Award,
    permission: ["examinations.view", "results.view"],
    hideForRoles: ["teacher"],
    children: [
      { to: "/examinations/exams", label: "Exams", permission: "examinations.view" },
      { to: "/examinations/scales", label: "Grading scales", permission: "examinations.view" },
      { to: "/examinations/enter-marks", label: "Enter marks", permission: "results.create" },
      { to: "/examinations/results", label: "Results", permission: "results.view" },
      { to: "/examinations/report-card", label: "Report card", permission: "results.view" },
      // Exams Director / School Administrator don't otherwise have the Academics module in their
      // sidebar (see its own hideForRoles), so they need a direct path here into the newer
      // Subjects & Results engine's own grade-entry and publish workflow, alongside the classic
      // Examinations pages above.
      {
        to: "/academics/subject-offerings",
        label: "Subject grades",
        permission: "academics.view",
        showForRoles: ["exams-director", "school-administrator"],
      },
      {
        to: "/academics/classes",
        label: "Class results & publish",
        permission: "academics.view",
        showForRoles: ["exams-director", "school-administrator"],
      },
    ],
  },
  {
    to: "/finance",
    label: "Finance",
    icon: Wallet,
    permission: ["fees.view", "payments.view"],
    children: [
      { to: "/finance/invoices", label: "Invoices", permission: "fees.view" },
      { to: "/finance/generate", label: "Generate invoices", permission: "fees.create" },
      { to: "/finance/payments", label: "Payments", permission: "payments.view" },
      { to: "/finance/structures", label: "Fee structures", permission: "fees.view" },
      { to: "/finance/categories", label: "Fee categories", permission: "fees.view" },
      { to: "/finance/stats", label: "Stats", permission: "fees.view" },
    ],
  },
  {
    to: "/salary",
    label: "Salary",
    icon: Banknote,
    permission: "salary.view",
    children: [
      { to: "/salary/payments", label: "Payments", permission: "salary.view" },
      { to: "/salary/generate", label: "Generate payments", permission: "salary.create" },
      { to: "/salary/structures", label: "Salary structures", permission: "salary.view" },
      { to: "/salary/assignments", label: "Staff assignments", permission: "salary.view" },
    ],
  },
  {
    to: "/library",
    label: "Library",
    icon: Library,
    permission: "library.view",
    children: [
      { to: "/library/checkout", label: "Checkout", permission: "library.create" },
      { to: "/library/loans", label: "Loans" },
      { to: "/library/reservations", label: "Reservations" },
      { to: "/library/books", label: "Books" },
      { to: "/library/categories", label: "Categories" },
    ],
  },
  {
    to: "/transport",
    label: "Transport",
    icon: Truck,
    permission: "transport.view",
    children: [
      { to: "/transport/vehicles", label: "Vehicles" },
      { to: "/transport/routes", label: "Routes" },
      { to: "/transport/assignments", label: "Assignments" },
    ],
  },
  {
    to: "/hostel",
    label: "Hostel",
    icon: BedDouble,
    permission: "hostel.view",
    children: [
      { to: "/hostel/hostels", label: "Hostels" },
      { to: "/hostel/allocations", label: "Allocations" },
    ],
  },
  {
    to: "/medical",
    label: "Medical",
    icon: HeartPulse,
    permission: "medical.view",
    children: [
      { to: "/medical/profiles", label: "Profiles" },
      { to: "/medical/visits", label: "Visits" },
    ],
  },
  { to: "/parents", label: "Parents", icon: Contact, permission: "parents.view" },
  { to: "/discipline", label: "Discipline", icon: ShieldAlert, permission: "discipline.view" },
  { to: "/my-discipline", label: "Discipline", icon: ShieldAlert, selfServiceFor: "student" },
  { to: "/communications", label: "Communications", icon: Megaphone, permission: "communications.view" },
  { to: "/events", label: "Events", icon: CalendarDays, permission: "events.view" },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  // No `permission` key — visible to every signed-in school account (staff of any role, and
  // students, who hold zero RBAC permissions), same as Complaints above. Only the "Add record"/
  // edit/delete actions inside RecordsListPage are gated, on records.create/update/delete.
  { to: "/records", label: "Records", icon: Archive },
  { to: "/my-subjects", label: "Subjects", icon: BookOpen, selfServiceFor: "student" },
  { to: "/my-results", label: "Results", icon: Award, selfServiceFor: "student" },
  { to: "/my-graduation-status", label: "Graduation Status", icon: GraduationCap, selfServiceFor: "student" },
  { to: "/assignments", label: "Assignments", icon: ClipboardList, permission: "assignments.view", hideForRoles: ["teacher"] },
  { to: "/education/lessons", label: "Lessons", icon: NotebookText, permission: "education.view", hideForRoles: ["teacher"] },
  { to: "/live-sessions", label: "Live Sessions", icon: Video, permission: "live_sessions.view" },
  { to: "/my-live-sessions", label: "Live Sessions", icon: Video, selfServiceFor: "student" },
  { to: "/my-medical", label: "Medical", icon: HeartPulse, selfServiceFor: "student" },
  { to: "/my-transport", label: "Transport", icon: Truck, selfServiceFor: "student" },
  { to: "/my-timetable", label: "Timetable", icon: CalendarClock, selfServiceFor: "student-or-staff", hideForRoles: ["principal", "exams-director"] },
  { to: "/my-documents", label: "Documents", icon: FileText, selfServiceFor: "student-or-staff", hideForRoles: ["principal", "school-administrator", "accountant", "exams-director", "teacher"] },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText,
    permission: "documents.view",
    children: [
      { to: "/documents/files", label: "Documents" },
      { to: "/documents/categories", label: "Categories" },
    ],
  },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Package,
    permission: "inventory.view",
    children: [
      { to: "/inventory/items", label: "Items" },
      { to: "/inventory/categories", label: "Categories" },
      { to: "/inventory/transactions", label: "Transactions" },
    ],
  },
  {
    to: "/procurement",
    label: "Procurement",
    icon: ShoppingCart,
    permission: "procurement.view",
    children: [
      { to: "/procurement/requests", label: "Requests" },
      { to: "/procurement/orders", label: "Orders" },
      { to: "/procurement/suppliers", label: "Suppliers" },
    ],
  },
  { to: "/audit", label: "Audit log", icon: History, permission: "audit.view" },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    permission: "reports.view",
    children: [
      { to: "/reports/enrollment", label: "Enrollment" },
      { to: "/reports/attendance", label: "Attendance" },
      { to: "/reports/academic-performance", label: "Academic performance" },
      { to: "/reports/finance", label: "Finance" },
    ],
  },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];
