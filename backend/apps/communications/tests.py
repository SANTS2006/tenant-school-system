import pytest

from apps.authorization.models import Role
from apps.authorization.services import assign_role, seed_default_roles_for_school, seed_permission_catalog
from apps.notifications.models import Notification
from tests.factories import (
    DEFAULT_TEST_PASSWORD,
    AnnouncementFactory,
    SchoolClassFactory,
    SchoolFactory,
    StudentFactory,
    UserFactory,
)

from .models import Announcement
from .services import publish_announcement, resolve_recipients

pytestmark = pytest.mark.django_db


def _login(api_client, user):
    return api_client.post(
        "/api/v1/auth/login/", {"email": user.email, "password": DEFAULT_TEST_PASSWORD}, format="json"
    )


def _principal():
    seed_permission_catalog()
    school = SchoolFactory()
    seed_default_roles_for_school(school)
    principal = UserFactory(school=school)
    assign_role(user=principal, role=Role.unscoped_objects.get(school=school, slug="principal"))
    return school, principal


class TestAnnouncementPermissions:
    def test_principal_can_create_announcement(self, api_client):
        school, principal = _principal()
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/communications/announcements/",
            {"title": "Sports Day", "body": "Sports day is next Friday.", "target_type": "school"},
            format="json",
        )
        assert response.status_code == 201

    def test_teacher_can_create_announcement(self, api_client):
        school, _ = _principal()
        teacher = UserFactory(school=school)
        assign_role(user=teacher, role=Role.unscoped_objects.get(school=school, slug="teacher"))
        _login(api_client, teacher)

        response = api_client.post(
            "/api/v1/communications/announcements/",
            {"title": "Homework reminder", "body": "Submit by Friday.", "target_type": "school"},
            format="json",
        )
        assert response.status_code == 201

    def test_accountant_cannot_create_announcement(self, api_client):
        school, _ = _principal()
        accountant = UserFactory(school=school)
        assign_role(user=accountant, role=Role.unscoped_objects.get(school=school, slug="accountant"))
        _login(api_client, accountant)

        response = api_client.post(
            "/api/v1/communications/announcements/",
            {"title": "Fee reminder", "body": "Pay your fees.", "target_type": "school"},
            format="json",
        )
        assert response.status_code == 403


class TestAnnouncementCrossSchoolValidation:
    def test_cannot_target_another_schools_class(self, api_client):
        school, principal = _principal()
        other_school = SchoolFactory()
        foreign_class = SchoolClassFactory(school=other_school)
        _login(api_client, principal)

        response = api_client.post(
            "/api/v1/communications/announcements/",
            {
                "title": "Class notice",
                "body": "Body",
                "target_type": "class",
                "target_class": str(foreign_class.id),
            },
            format="json",
        )
        assert response.status_code == 400


class TestPublishAnnouncement:
    def test_publish_school_target_notifies_all_active_users(self, api_client):
        school, principal = _principal()
        other_user = UserFactory(school=school)
        announcement = AnnouncementFactory(school=school, target_type=Announcement.TargetType.SCHOOL)
        _login(api_client, principal)

        response = api_client.post(f"/api/v1/communications/announcements/{announcement.id}/publish/")

        assert response.status_code == 200
        recipient_ids = set(
            Notification.unscoped_objects.filter(category="announcement").values_list("recipient_id", flat=True)
        )
        assert principal.id in recipient_ids
        assert other_user.id in recipient_ids

    def test_publish_students_target_only_notifies_enrolled_students(self, api_client):
        school, principal = _principal()
        school_class = SchoolClassFactory(school=school)
        member = StudentFactory(school=school, current_class=school_class)
        member.user = UserFactory(school=school)
        member.save(update_fields=["user"])
        non_member = StudentFactory(school=school)
        non_member.user = UserFactory(school=school)
        non_member.save(update_fields=["user"])

        announcement = AnnouncementFactory(
            school=school, target_type=Announcement.TargetType.CLASS, target_class=school_class
        )
        _login(api_client, principal)

        response = api_client.post(f"/api/v1/communications/announcements/{announcement.id}/publish/")

        assert response.status_code == 200
        recipient_ids = set(
            Notification.unscoped_objects.filter(category="announcement").values_list("recipient_id", flat=True)
        )
        assert member.user_id in recipient_ids
        assert non_member.user_id not in recipient_ids

    def test_publish_sets_published_at(self):
        school = SchoolFactory()
        announcement = AnnouncementFactory(school=school, target_type=Announcement.TargetType.SCHOOL)
        assert announcement.published_at is None

        publish_announcement(announcement)

        announcement.refresh_from_db()
        assert announcement.published_at is not None


class TestResolveRecipients:
    def test_resolve_recipients_works_outside_request_context(self):
        """resolve_recipients must use unscoped_objects — it can be called from a
        management command or test with no tenant contextvar set at all."""
        school = SchoolFactory()
        UserFactory(school=school)
        announcement = AnnouncementFactory(school=school, target_type=Announcement.TargetType.SCHOOL)

        recipients = resolve_recipients(announcement)

        assert len(recipients) >= 1


class TestAnnouncementTenantIsolation:
    def test_cannot_list_another_schools_announcements(self, api_client):
        school_a, principal_a = _principal()
        school_b, _ = _principal()
        AnnouncementFactory(school=school_b)
        announcement_a = AnnouncementFactory(school=school_a)

        _login(api_client, principal_a)
        response = api_client.get("/api/v1/communications/announcements/")

        assert response.status_code == 200
        ids_seen = {row["id"] for row in response.data["results"]}
        assert str(announcement_a.id) in ids_seen
        assert len(ids_seen) == 1
