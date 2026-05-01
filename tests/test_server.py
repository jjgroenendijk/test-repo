import pytest
from fastapi.testclient import TestClient
import json
import os

from server import app, DATA_DIR, HISTORY_FILE

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_history():
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
    yield
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()

def test_get_jobs_empty():
    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert response.json() == []

def test_create_job():
    response = client.post("/api/jobs", json={"url": "https://open.spotify.com/track/123"})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["url"] == "https://open.spotify.com/track/123"
    assert data["status"] == "Queued"

    # Verify it was added to history
    response = client.get("/api/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) == 1
    assert jobs[0]["id"] == data["id"]
