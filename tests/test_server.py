import json
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

@patch('server.run_spotiflac')
def test_clear_history(mock_run):
    # Create an initial job (mock makes it complete successfully, but background task means it might be queued initially)
    # However, for tests, we can directly manipulate the test history file or create a job and let it run,
    # then clear history.

    # Create two jobs
    response1 = client.post("/api/jobs", json={"url": "https://open.spotify.com/track/123"})
    job1_id = response1.json()["id"]

    response2 = client.post("/api/jobs", json={"url": "https://open.spotify.com/track/456"})
    job2_id = response2.json()["id"]

    # One job we'll cancel so it's "Cancelled"
    client.delete(f"/api/jobs/{job1_id}")

    # Wait for the other job to potentially be running or queued, let's inject a "Completed" status
    # for testing purposes into the history file directly to be sure it gets cleared.

    with open(HISTORY_FILE, "r") as f:
        history = json.load(f)

    for job in history:
        if job["id"] == job2_id:
            job["status"] = "Completed"

    history.append({
        "id": "running-job-id",
        "url": "https://open.spotify.com/track/789",
        "status": "Running",
        "created_at": "2023-01-01T00:00:00Z"
    })

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

    # Call clear history
    response = client.delete("/api/history/clear")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["cleared"] >= 2 # Cancelled and Completed

    # Verify history
    response = client.get("/api/jobs")
    jobs = response.json()

    # Only the "Running" job should remain
    assert len(jobs) == 1
    assert jobs[0]["id"] == "running-job-id"
    assert jobs[0]["status"] == "Running"
