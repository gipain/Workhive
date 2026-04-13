"""Tests for authentication endpoints."""
import pytest
from tests.conftest import register_student, register_company, auth_header


class TestRegister:
    def test_register_student_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "new_student@test.com",
            "password": "StrongPass1!",
            "role": "student",
            "first_name": "Іван",
            "last_name": "Шевченко",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_register_company_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "new_company@test.com",
            "password": "StrongPass1!",
            "role": "company",
            "company_name": "Нова Компанія",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_register_duplicate_email(self, client):
        register_student(client, email="dup@test.com")
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com",
            "password": "StrongPass1!",
            "role": "student",
            "first_name": "Дубль",
            "last_name": "Тест",
        })
        assert resp.status_code == 409

    def test_register_student_missing_name(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "noname@test.com",
            "password": "StrongPass1!",
            "role": "student",
        })
        assert resp.status_code == 400

    def test_register_company_missing_name(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "noname_co@test.com",
            "password": "StrongPass1!",
            "role": "company",
        })
        assert resp.status_code == 400

    def test_register_invalid_role(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "badrole@test.com",
            "password": "StrongPass1!",
            "role": "admin",
            "first_name": "X",
            "last_name": "Y",
        })
        assert resp.status_code == 422

    def test_register_short_password(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "short@test.com",
            "password": "Ab1!",
            "role": "student",
            "first_name": "X",
            "last_name": "Y",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        register_student(client, email="login@test.com")
        resp = client.post("/api/auth/login", json={
            "email": "login@test.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client):
        register_student(client, email="wrong@test.com")
        resp = client.post("/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "WrongPass!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "ghost@test.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_success(self, client):
        tokens = register_student(client, email="refresh@test.com")
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": tokens["refresh_token"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_with_access_token_fails(self, client):
        tokens = register_student(client, email="badref@test.com")
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": tokens["access_token"],
        })
        assert resp.status_code == 401

    def test_refresh_invalid_token(self, client):
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert resp.status_code == 401


class TestMe:
    def test_me_student(self, client):
        tokens = register_student(client, email="me_s@test.com", first_name="Олег", last_name="Тест")
        resp = client.get("/api/auth/me", headers=auth_header(tokens["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "me_s@test.com"
        assert data["role"] == "student"
        assert data["student_profile"]["first_name"] == "Олег"

    def test_me_company(self, client):
        tokens = register_company(client, email="me_c@test.com", company_name="МояКомпанія")
        resp = client.get("/api/auth/me", headers=auth_header(tokens["access_token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "company"
        assert data["company_profile"]["company_name"] == "МояКомпанія"

    def test_me_no_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers=auth_header("bad.token.value"))
        assert resp.status_code == 401
