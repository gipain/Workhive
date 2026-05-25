"""
Конфігурація для модульних тестів — без підключення до бази даних.
"""
import os
os.environ["DATABASE_URL"] = "postgresql://x:x@localhost:9999/x"  # dummy url

import pytest


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """No-op override: unit tests don't need the database."""
    yield
