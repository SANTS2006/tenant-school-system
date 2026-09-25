import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.common.validators import validate_image_file, validate_upload_file
from tests.factories import DEFAULT_TEST_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db


class TestSecurityHeaders:
    def test_api_responses_are_never_cacheable_and_carry_a_locked_down_csp(self, api_client):
        response = api_client.get("/api/v1/health/")

        assert "no-store" in response["Cache-Control"]
        assert "default-src 'none'" in response["Content-Security-Policy"]
        assert "frame-ancestors 'none'" in response["Content-Security-Policy"]
        assert response["X-Content-Type-Options"] == "nosniff"
        assert response["X-Frame-Options"] == "DENY"
        assert "geolocation=()" in response["Permissions-Policy"]

    def test_authenticated_api_responses_are_also_no_store(self, api_client):
        user = UserFactory()
        api_client.post("/api/v1/auth/login/", {"email": user.email, "password": DEFAULT_TEST_PASSWORD}, format="json")
        response = api_client.get("/api/v1/auth/me/")

        assert response.status_code == 200
        assert "no-store" in response["Cache-Control"]


class TestRequestSizeLimit:
    def test_oversized_json_body_is_rejected_before_parsing(self, api_client):
        huge = {"email": "a@example.test", "password": "x" * (3 * 1024 * 1024)}
        response = api_client.post("/api/v1/auth/login/", huge, format="json")

        assert response.status_code == 413
        assert response.json()["code"] == "REQUEST_TOO_LARGE"


class TestUploadContentSniffing:
    @pytest.mark.parametrize(
        "name,content",
        [
            ("report.pdf", bytes.fromhex("4d5a9000")),  # Windows executable renamed to .pdf
            ("photo.png", b"<svg onload=alert(1)>"),
            ("notes.txt", b"#!/bin/sh\nrm -rf /"),
            ("scan.jpg", b"<html><script>steal()</script>"),
            ("data.csv", bytes.fromhex("7f454c46")),  # ELF binary
        ],
    )
    def test_disguised_executables_and_markup_are_rejected(self, name, content):
        with pytest.raises(ValidationError):
            validate_upload_file(SimpleUploadedFile(name, content))

    def test_ordinary_files_still_pass_and_stream_position_is_preserved(self):
        upload = SimpleUploadedFile("policy.pdf", b"%PDF-1.4 ordinary document")
        validate_upload_file(upload)
        assert upload.read() == b"%PDF-1.4 ordinary document"

    def test_image_validator_also_sniffs(self):
        with pytest.raises(ValidationError):
            validate_image_file(SimpleUploadedFile("avatar.png", b"<svg/onload=1>"))


class TestClientIp:
    def _request(self, forwarded_for, remote="10.0.0.9"):
        from django.test import RequestFactory

        request = RequestFactory().get("/")
        request.META["REMOTE_ADDR"] = remote
        if forwarded_for is not None:
            request.META["HTTP_X_FORWARDED_FOR"] = forwarded_for
        return request

    def test_forged_forwarded_for_is_ignored_when_no_proxy_is_trusted(self, settings):
        from apps.common.net import get_client_ip

        settings.TRUSTED_PROXY_COUNT = 0
        assert get_client_ip(self._request("1.2.3.4")) == "10.0.0.9"

    def test_only_the_entry_our_own_proxy_appended_is_trusted(self, settings):
        from apps.common.net import get_client_ip

        settings.TRUSTED_PROXY_COUNT = 1
        # The attacker sent "6.6.6.6"; our proxy appended the address it actually saw.
        assert get_client_ip(self._request("6.6.6.6, 203.0.113.7")) == "203.0.113.7"

    def test_falls_back_to_remote_addr_without_the_header(self, settings):
        from apps.common.net import get_client_ip

        settings.TRUSTED_PROXY_COUNT = 1
        assert get_client_ip(self._request(None)) == "10.0.0.9"


class TestSingleOriginSpaServing:
    def _dist(self, tmp_path, settings):
        (tmp_path / "index.html").write_text("<!doctype html><title>NTS</title>")
        settings.FRONTEND_DIST_DIR = tmp_path

    def test_client_side_routes_get_the_html_shell_with_a_strict_csp(self, api_client, tmp_path, settings):
        self._dist(tmp_path, settings)
        response = api_client.get("/students/123/edit")

        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/html")
        csp = response["Content-Security-Policy"]
        assert "script-src 'self'" in csp and "unsafe-inline'" not in csp.split("style-src-attr")[0]
        assert "frame-ancestors 'none'" in csp
        assert "no-cache" in response["Cache-Control"]
        assert "camera=(self" in response["Permissions-Policy"]

    def test_unknown_api_paths_stay_a_real_404_not_the_html_shell(self, api_client, tmp_path, settings):
        self._dist(tmp_path, settings)
        response = api_client.get("/api/v1/definitely-not-a-route/")

        assert response.status_code == 404
        assert not response["Content-Type"].startswith("text/html")

    def test_non_get_requests_to_spa_paths_are_rejected(self, api_client, tmp_path, settings):
        self._dist(tmp_path, settings)
        assert api_client.post("/students/123", {}, format="json").status_code == 404
