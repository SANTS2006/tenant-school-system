from django.core.management.base import BaseCommand

from apps.students.models import Student
from apps.students.services import provision_student_account


class Command(BaseCommand):
    help = "Create default logins for every student that doesn't have one yet."

    def handle(self, *args, **options):
        created = 0
        for student in Student.unscoped_objects.filter(user__isnull=True).select_related("school"):
            user = provision_student_account(student)
            if user:
                created += 1
                self.stdout.write(f"{student.full_name}: {user.email}")
        self.stdout.write(self.style.SUCCESS(f"Provisioned {created} student account(s)."))
