"""Tests for project endpoints."""
import pytest
from tests.conftest import register_student, register_company, auth_header, create_project


class TestListProjects:
    def test_list_empty(self, client):
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_with_projects(self, client):
        co = register_company(client)
        create_project(client, co["access_token"], title="Проєкт A")
        create_project(client, co["access_token"], title="Проєкт B")
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    def test_list_search(self, client):
        co = register_company(client)
        create_project(client, co["access_token"], title="Python розробка")
        create_project(client, co["access_token"], title="Дизайн логотипу")
        resp = client.get("/api/projects", params={"search": "Python"})
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Python розробка"

    def test_list_pagination(self, client):
        co = register_company(client)
        for i in range(5):
            create_project(client, co["access_token"], title=f"Проєкт {i}")
        resp = client.get("/api/projects", params={"page": 1, "size": 2})
        data = resp.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["page"] == 1


class TestCreateProject:
    def test_create_success(self, client):
        co = register_company(client)
        resp = client.post("/api/projects", json={
            "title": "Новий проєкт",
            "description": "Детальний опис нового проєкту",
            "max_applicants": 5,
        }, headers=auth_header(co["access_token"]))
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Новий проєкт"
        assert data["status"] == "open"
        assert data["max_applicants"] == 5

    def test_create_with_skills(self, client):
        co = register_company(client)
        resp = client.post("/api/projects", json={
            "title": "Проєкт зі скілами",
            "description": "Потрібні знання",
            "skill_names": ["Python", "React"],
        }, headers=auth_header(co["access_token"]))
        assert resp.status_code == 201
        data = resp.json()
        skill_names = [s["name"] for s in data["skills"]]
        assert "Python" in skill_names
        assert "React" in skill_names

    def test_create_forbidden_for_student(self, client):
        st = register_student(client)
        resp = client.post("/api/projects", json={
            "title": "Nope project",
            "description": "Should fail for student role",
        }, headers=auth_header(st["access_token"]))
        assert resp.status_code == 403

    def test_create_unauthorized(self, client):
        resp = client.post("/api/projects", json={
            "title": "Nope project",
            "description": "Unauthorized request test",
        })
        assert resp.status_code == 401


class TestGetProject:
    def test_get_by_id(self, client):
        co = register_company(client)
        proj = create_project(client, co["access_token"], title="Деталі Проєкту")
        resp = client.get(f"/api/projects/{proj['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Деталі Проєкту"

    def test_get_nonexistent(self, client):
        import uuid
        resp = client.get(f"/api/projects/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestUpdateProject:
    def test_update_success(self, client):
        co = register_company(client)
        proj = create_project(client, co["access_token"])
        resp = client.put(f"/api/projects/{proj['id']}", json={
            "title": "Оновлений проєкт",
        }, headers=auth_header(co["access_token"]))
        assert resp.status_code == 200
        assert resp.json()["title"] == "Оновлений проєкт"

    def test_update_by_other_company_forbidden(self, client):
        co1 = register_company(client)
        co2 = register_company(client)
        proj = create_project(client, co1["access_token"])
        resp = client.put(f"/api/projects/{proj['id']}", json={
            "title": "Hacked",
        }, headers=auth_header(co2["access_token"]))
        assert resp.status_code == 403


class TestCancelProject:
    def test_cancel_success(self, client):
        co = register_company(client)
        proj = create_project(client, co["access_token"])
        resp = client.patch(f"/api/projects/{proj['id']}/cancel",
                            headers=auth_header(co["access_token"]))
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_cancel_by_other_forbidden(self, client):
        co1 = register_company(client)
        co2 = register_company(client)
        proj = create_project(client, co1["access_token"])
        resp = client.patch(f"/api/projects/{proj['id']}/cancel",
                            headers=auth_header(co2["access_token"]))
        assert resp.status_code == 403
