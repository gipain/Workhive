"""Tests for student and company profile endpoints, compat routes, and health."""
import pytest
from tests.conftest import register_student, register_company, auth_header, create_project


class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


class TestStudentProfile:
    def test_list_students(self, client):
        register_student(client, first_name="Олена", last_name="Коваль")
        resp = client.get("/api/students")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_get_student_me(self, client):
        st = register_student(client, first_name="Андрій", last_name="Мельник")
        resp = client.get("/api/students/me", headers=auth_header(st["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["first_name"] == "Андрій"

    def test_update_student_me(self, client):
        st = register_student(client)
        resp = client.put("/api/students/me", json={
            "bio": "Студент-програміст",
            "university": "КНУ",
        }, headers=auth_header(st["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["bio"] == "Студент-програміст"
        assert data["university"] == "КНУ"


class TestCompanyProfile:
    def test_list_companies(self, client):
        register_company(client, company_name="ТехноСтарт")
        resp = client.get("/api/companies")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_get_company_me(self, client):
        co = register_company(client, company_name="МоєТовариство")
        resp = client.get("/api/companies/me", headers=auth_header(co["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["company_name"] == "МоєТовариство"

    def test_update_company_me(self, client):
        co = register_company(client)
        resp = client.put("/api/companies/me", json={
            "description": "Ми робимо круті речі",
            "website": "https://example.com",
        }, headers=auth_header(co["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] == "Ми робимо круті речі"


class TestSkillsCompat:
    def test_list_skills_empty(self, client):
        resp = client.get("/api/skills")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_skills_populated_after_project(self, client):
        co = register_company(client)
        create_project(client, co["access_token"], skill_names=["Go", "Docker"])
        resp = client.get("/api/skills")
        assert resp.status_code == 200
        names = [s["name"] for s in resp.json()]
        assert "Go" in names
        assert "Docker" in names


class TestCompatApplicationRoutes:
    def test_flat_apply(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        resp = client.post("/api/applications", json={
            "project_id": proj["id"],
            "cover_letter": "Flat route",
        }, headers=auth_header(st["access_token"]))
        assert resp.status_code == 201

    def test_my_applications_compat(self, client):
        co = register_company(client)
        st = register_student(client)
        proj = create_project(client, co["access_token"])
        client.post("/api/applications", json={
            "project_id": proj["id"],
        }, headers=auth_header(st["access_token"]))
        resp = client.get("/api/applications/my", headers=auth_header(st["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    def test_accept_compat(self, client):
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
            f"/api/applications/{app_id}/accept",
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"

    def test_reject_compat(self, client):
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
            f"/api/applications/{app_id}/reject",
            headers=auth_header(co["access_token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"
