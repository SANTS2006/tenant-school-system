"""
Fixed, global permission catalog. Extend this as new domain apps land —
each new app should add its own `<module>.view/create/update/delete` (and
any special actions, e.g. `results.publish`) here, then re-run
`python manage.py seed_permissions` (idempotent).
"""

PERMISSION_CATALOG = [
    ("students.view", "View students", "students"),
    ("students.create", "Create students", "students"),
    ("students.update", "Update students", "students"),
    ("students.delete", "Archive/delete students", "students"),
    ("attendance.view", "View attendance", "attendance"),
    ("attendance.create", "Record attendance", "attendance"),
    ("attendance.update", "Update attendance records", "attendance"),
    ("attendance.delete", "Delete attendance records", "attendance"),
    ("staff_attendance.view", "View staff attendance", "staff_attendance"),
    ("staff_attendance.create", "Record staff attendance", "staff_attendance"),
    ("staff_attendance.update", "Update staff attendance records", "staff_attendance"),
    ("staff_attendance.delete", "Delete staff attendance records", "staff_attendance"),
    ("timetable.view", "View timetable", "timetable"),
    ("timetable.create", "Create timetable entries", "timetable"),
    ("timetable.update", "Update timetable entries", "timetable"),
    ("timetable.delete", "Delete timetable entries", "timetable"),
    ("results.view", "View results", "results"),
    ("results.create", "Enter results", "results"),
    ("results.update", "Update results", "results"),
    ("results.approve", "Approve reviewed results", "results"),
    ("results.publish", "Publish results", "results"),
    ("results.lock", "Lock published results", "results"),
    ("examinations.view", "View exams and schedules", "examinations"),
    ("examinations.create", "Create exams and schedules", "examinations"),
    ("examinations.update", "Update exams and schedules", "examinations"),
    ("examinations.delete", "Delete exams and schedules", "examinations"),
    ("fees.view", "View fee structures/invoices", "fees"),
    ("fees.create", "Create fee structures/invoices", "fees"),
    ("fees.update", "Update fee structures/invoices", "fees"),
    ("fees.delete", "Delete fee structures/categories", "fees"),
    ("payments.view", "View payments", "payments"),
    ("payments.record", "Record payments", "payments"),
    ("payments.refund", "Issue refunds", "payments"),
    ("reports.view", "View reports", "reports"),
    ("reports.generate", "Generate reports", "reports"),
    ("reports.export", "Export reports", "reports"),
    ("users.view", "View users", "users"),
    ("users.create", "Create/invite users", "users"),
    ("users.update", "Update users", "users"),
    ("users.disable", "Disable/deactivate users", "users"),
    ("users.reset_password", "Reset a user's password to the school default", "users"),
    ("settings.view", "View school settings", "settings"),
    ("settings.update", "Update school settings", "settings"),
    ("audit.view", "View audit logs", "audit"),
    ("staff.view", "View staff", "staff"),
    ("staff.create", "Create staff profiles", "staff"),
    ("staff.update", "Update staff profiles", "staff"),
    ("staff.delete", "Deactivate staff", "staff"),
    ("parents.view", "View parents/guardians", "parents"),
    ("parents.create", "Create parents/guardians", "parents"),
    ("parents.update", "Update parents/guardians", "parents"),
    ("parents.delete", "Remove parents/guardians", "parents"),
    ("academics.view", "View academic structure", "academics"),
    ("academics.create", "Create academic structure", "academics"),
    ("academics.update", "Update academic structure", "academics"),
    ("academics.delete", "Delete academic structure", "academics"),
    ("library.view", "View library catalog and loans", "library"),
    ("library.create", "Create library records", "library"),
    ("library.update", "Update library records (checkout/return/renew)", "library"),
    ("library.delete", "Delete library records", "library"),
    ("transport.view", "View transport records", "transport"),
    ("transport.create", "Create transport records", "transport"),
    ("transport.update", "Update transport records", "transport"),
    ("transport.delete", "Delete transport records", "transport"),
    ("hostel.view", "View hostel records", "hostel"),
    ("hostel.create", "Create hostel records", "hostel"),
    ("hostel.update", "Update hostel records (allocate/check-out)", "hostel"),
    ("hostel.delete", "Delete hostel records", "hostel"),
    ("medical.view", "View medical records", "medical"),
    ("medical.create", "Create medical records", "medical"),
    ("medical.update", "Update medical records", "medical"),
    ("medical.delete", "Delete medical records", "medical"),
    ("discipline.view", "View discipline records", "discipline"),
    ("discipline.create", "Create discipline records", "discipline"),
    ("discipline.update", "Update discipline records", "discipline"),
    ("discipline.delete", "Delete discipline records", "discipline"),
    ("communications.view", "View announcements", "communications"),
    ("communications.create", "Create and publish announcements", "communications"),
    ("communications.update", "Update announcements", "communications"),
    ("communications.delete", "Delete announcements", "communications"),
    ("assignments.view", "View assignments and submissions", "assignments"),
    ("assignments.create", "Create assignments", "assignments"),
    ("assignments.update", "Update assignments and grade submissions", "assignments"),
    ("assignments.delete", "Delete assignments", "assignments"),
    ("documents.view", "View documents", "documents"),
    ("documents.create", "Upload documents", "documents"),
    ("documents.update", "Update documents", "documents"),
    ("documents.delete", "Delete documents", "documents"),
    # Records has no `.view` code at all — deliberately: viewing a Record is open to every
    # signed-in account of the school (see RecordViewSet), not gated by permission. Only the
    # write actions below are ever checked.
    ("records.create", "Add records", "records"),
    ("records.update", "Edit records", "records"),
    ("records.delete", "Delete records", "records"),
    ("inventory.view", "View inventory items and stock transactions", "inventory"),
    ("inventory.create", "Create inventory items and categories", "inventory"),
    ("inventory.update", "Update inventory items and record stock movements", "inventory"),
    ("inventory.delete", "Delete inventory items and categories", "inventory"),
    ("procurement.view", "View purchase requests, orders, and suppliers", "procurement"),
    ("procurement.create", "Create purchase requests, orders, and suppliers", "procurement"),
    ("procurement.update", "Update purchase requests/orders and record receipts", "procurement"),
    ("procurement.approve", "Approve or reject purchase requests", "procurement"),
    ("procurement.delete", "Delete purchase requests, orders, and suppliers", "procurement"),
    ("events.view", "View events", "events"),
    ("events.create", "Create and publish events", "events"),
    ("events.update", "Update events", "events"),
    ("events.delete", "Delete events", "events"),
    ("events.register", "Register/RSVP for events", "events"),
    ("complaints.view", "View every complaint in the school", "complaints"),
    ("complaints.manage", "Assign, resolve, reject, and respond to complaints", "complaints"),
    ("education.view", "View lessons and lesson materials", "education"),
    ("education.create", "Create lessons and upload materials", "education"),
    ("education.update", "Update lessons and materials", "education"),
    ("education.delete", "Delete lessons and materials", "education"),
    ("live_sessions.view", "View live video lesson sessions", "live_sessions"),
    ("live_sessions.create", "Schedule live video lesson sessions", "live_sessions"),
    ("live_sessions.update", "Start, end, and update live sessions", "live_sessions"),
    ("live_sessions.delete", "Delete live sessions", "live_sessions"),
    ("salary.view", "View salary structures and payments", "salary"),
    ("salary.create", "Create salary structures and process salary payments", "salary"),
    ("salary.update", "Update salary structures and staff salary assignments", "salary"),
    ("salary.delete", "Delete salary structures", "salary"),
]

# Default role -> permission spec mapping used when seeding (and re-syncing) a school's system
# roles. Each spec is either a plain list of prefixes (shorthand for {"include": that list,
# "exclude": []}) or an explicit {"include": [...], "exclude": [...]} dict for a role that needs
# to grant a broad prefix and then take a few specific codes back — a plain prefix allow-list has
# no subtraction operator, so "everything except a few narrow exceptions" (Principal) needs the
# dict form. A permission is granted if its code starts with any "include" prefix AND does not
# start with (or equal) any "exclude" prefix. See services.py::seed_default_roles_for_school,
# which now does a full sync (adds AND removes) against this spec for is_system=True roles only.
DEFAULT_ROLE_PERMISSION_PREFIXES = {
    "principal": {
        "include": [""],  # view + full CRUD on everything by default
        "exclude": [
            # narrowed to view-only:
            "attendance.create", "attendance.update", "attendance.delete",
            "inventory.create", "inventory.update", "inventory.delete",
            # no access at all:
            "assignments.", "education.", "live_sessions.",
        ],
    },
    "school-administrator": {
        "include": [
            "students.", "attendance.", "staff_attendance.", "results.", "users.", "settings.",
            "staff.", "parents.", "academics.", "transport.", "hostel.", "medical.",
            "discipline.", "communications.", "documents.", "inventory.", "procurement.",
            "events.", "complaints.", "salary.", "reports.", "audit.", "examinations.", "records.",
            # view-only:
            "fees.view", "payments.view", "library.view",
            # timetable, education, assignments, live_sessions: no access — simply never
            # included, so no exclude list is needed for those.
        ],
        "exclude": [],
    },
    "teacher": {
        "include": [
            "students.view", "academics.view", "results.view",
            "communications.", "complaints.", "documents.", "education.", "live_sessions.",
            "assignments.",
        ],
        "exclude": [],
    },
    "accountant": {
        "include": [
            "fees.", "payments.", "documents.", "inventory.", "procurement.", "salary.",
            "staff.", "communications.", "complaints.", "academics.view", "students.view",
        ],
        "exclude": [],
    },
    "exams-director": {
        "include": [
            "examinations.", "results.", "timetable.", "staff_attendance.",
            "communications.", "complaints.", "documents.", "events.", "academics.view", "students.view",
        ],
        "exclude": [],
    },
}

DEFAULT_ROLE_NAMES = {
    "principal": "Principal / Head of School",
    "school-administrator": "School Administrator",
    "teacher": "Teacher",
    "accountant": "Accountant",
    "exams-director": "Exams Director",
}
