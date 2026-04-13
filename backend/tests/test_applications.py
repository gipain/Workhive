"""Tests for application endpoints."""
import uuid
import pytest
from tests.conftest import register_student, register_company, auth_header, create_project


class TestApplyToProject:
    def test_apply_success(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={"cover_letter": "Хочу працювати!"},
            headers=auth_header(st["access_token"]),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] == proj["id"]
        assert data["status"] == "pending"
        assert data["cover_letter"] == "Хочу працювати!"

    def test_apply_duplicate(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        assert resp.status_code == 409

    def test_apply_company_forbidden(self, client):
        co = register_company(client)
        proj = create_project(client, co["access_token"])
        resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 403

    def test_apply_nonexistent_project(self, client):
        st = register_student(client)
        resp = client.post(
            f"/api/projects/{uuid.uuid4()}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        assert resp.status_code == 404

    def test_apply_to_cancelled_project(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        client.patch(f"/api/projects/{proj['id']}/cancel",
                     headers=auth_header(co["access_token"]))
        resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        assert resp.status_code == 400


class TestListProjectApplications:
    def test_list_as_company(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        resp = client.get(
            f"/api/projects/{proj['id']}/applications",
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    def test_list_as_other_company_forbidden(self, client):
        co1 = register_company(client)
        co2 = register_company(client)
        proj = create_project(client, co1["access_token"])
        resp = client.get(
            f"/api/projects/{proj['id']}/applications",
            headers=auth_header(co2["access_token"]),
        )
        assert resp.status_code == 403


class TestMyApplications:
    def test_list_own_applications(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        resp = client.get("/api/me/applications", headers=auth_header(st["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    def test_empty_applications(self, client):
        st = register_student(client)
        resp = client.get("/api/me/applications", headers=auth_header(st["access_token"]))
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


class TestUpdateApplicationStatus:
    def test_accept_application(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        apply_resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        app_id = apply_resp.json()["id"]
        resp = client.patch(
            f"/api/applications/{app_id}",
            json={"status": "accepted"},
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"

    def test_reject_application(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        apply_resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        app_id = apply_resp.json()["id"]
        resp = client.patch(
            f"/api/applications/{app_id}",
            json={"status": "rejected"},
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"

    def test_student_cannot_update_status(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        apply_resp = client.post(
            f"/api/projects/{proj['id']}/applications",
            json={},
            headers=auth_header(st["access_token"]),
        )
        app_id = apply_resp.json()["id"]
        resp = client.patch(
            f"/api/applications/{app_id}",
            json={"status": "accepted"},
            headers=auth_header(st["access_token"]),
        )
        assert resp.status_code == 403
