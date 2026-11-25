import os
import uuid
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Configure test environment variables before imports
os.environ["JWT_SECRET"] = "test-secret-key-for-isolated-testing-only-1234567890"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.database import Base, get_db, engine as prod_engine, SessionLocal as prod_session_factory
import app.core.database as db_module
from app.main import app
from app.models.document import User, Document, DocumentExtraction, ValidationResult, AuditLog, CrossVerification, ProcessingJob
from app.core.auth import AuthService

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch the application's engine and SessionLocal to use the isolated test database
db_module.engine = test_engine
db_module.SessionLocal = TestingSessionLocal

@pytest.fixture(scope="session", autouse=True)
def initialize_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def db():
    """Provides a transactional database session that resets after each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Creates a new authenticated user and returns their bearer Authorization header."""
    user_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPassword123!"
    res = client.post("/api/v1/auth/signup", json={
        "email": user_email,
        "password": pwd,
        "full_name": "Test Suite User"
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {
        "Authorization": f"Bearer {token}",
        "email": user_email,
        "user_id": res.json()["user"]["id"],
        "token": token
    }

@pytest.fixture
def sample_dir():
    return Path(__file__).parent.parent / "sample_data"
