from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from server import app, HISTORY_FILE

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

@patch('server.run_spotiflac')
def test_create_job(mock_run):
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

@patch('server.run_spotiflac')
def test_cancel_job(mock_run):
    # Create job
    response = client.post("/api/jobs", json={"url": "https://open.spotify.com/track/456"})
    data = response.json()
    job_id = data["id"]

    # Cancel job
    response = client.delete(f"/api/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Verify status in history
    response = client.get("/api/jobs")
    jobs = response.json()
    assert jobs[0]["id"] == job_id
    assert jobs[0]["status"] == "Cancelled"

def test_cancel_nonexistent_job():
    response = client.delete("/api/jobs/not-a-real-id")
    assert response.status_code == 404

def test_get_job_log(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    logs_dir = data_dir / "logs"
    logs_dir.mkdir()

    monkeypatch.setattr("server.LOGS_DIR", logs_dir)

    job_id = "test-job-123"
    log_content = "This is a test log\nWith multiple lines\n"

    log_file = logs_dir / f"{job_id}.log"
    log_file.write_text(log_content)

    response = client.get(f"/api/jobs/{job_id}/log")
    assert response.status_code == 200
    assert response.json() == {"log": log_content}

def test_get_job_log_not_found(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    logs_dir = data_dir / "logs"
    logs_dir.mkdir()

    monkeypatch.setattr("server.LOGS_DIR", logs_dir)

    response = client.get("/api/jobs/nonexistent-job/log")
    assert response.status_code == 404
