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

def test_clear_failed_history():
    import json

    # Write some dummy jobs directly to history file
    dummy_history = [
        {"id": "job-1", "url": "https://open.spotify.com/track/abc", "status": "Failed"},
        {"id": "job-2", "url": "https://open.spotify.com/track/def", "status": "Completed"},
        {"id": "job-3", "url": "https://open.spotify.com/track/ghi", "status": "Failed"},
        {"id": "job-4", "url": "https://open.spotify.com/track/jkl", "status": "Running"}
    ]
    with open(HISTORY_FILE, "w") as f:
        json.dump(dummy_history, f)

    resp = client.delete("/api/history/clear-failed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["cleared"] == 2

    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    remaining_jobs = resp.json()

    assert len(remaining_jobs) == 2
    statuses = [j["status"] for j in remaining_jobs]
    assert "Completed" in statuses
    assert "Running" in statuses
    assert "Failed" not in statuses

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

def test_get_job_progress(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    logs_dir = data_dir / "logs"
    logs_dir.mkdir()

    monkeypatch.setattr("server.LOGS_DIR", logs_dir)

    job_id = "test-job-prog"
    log_file = logs_dir / f"{job_id}.log"

    # 1. Test not found
    response = client.get(f"/api/jobs/{job_id}/progress")
    assert response.status_code == 200
    assert response.json() is None

    # 2. Test empty/no progress log
    log_file.write_text("Starting download...\n")
    response = client.get(f"/api/jobs/{job_id}/progress")
    assert response.status_code == 200
    assert response.json() is None

    # 3. Test log with progress and track name
    log_content = """Fetching metadata...
[1/13] Daft Punk
  ↳ Give Life Back to Music
[2/13] Daft Punk
  ↳ The Game of Love
"""
    log_file.write_text(log_content)
    response = client.get(f"/api/jobs/{job_id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["current"] == 2
    assert data["total"] == 13
    assert data["track"] == "The Game of Love"
    assert data["percentage"] == 15

    # 4. Test log with progress but no track name yet
    log_content = """Fetching metadata...
[3/13] Daft Punk
"""
    log_file.write_text(log_content)
    response = client.get(f"/api/jobs/{job_id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["current"] == 3
    assert data["total"] == 13
    assert data["track"] is None
    assert data["percentage"] == 23

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

def test_download_job_zip(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-download-job"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    (job_dir / "track.flac").write_text("dummy flac content")

    response = client.get(f"/api/jobs/{job_id}/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"

    # We could also check if the zip file actually unzips properly, but checking response headers is sufficient here.

def test_download_job_zip_invalid_id():
    response = client.get("/api/jobs/invalid..id/download")
    assert response.status_code == 400

def test_download_job_zip_not_found(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    response = client.get("/api/jobs/nonexistent-job/download")
    assert response.status_code == 404

def test_download_single_file(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-job-file"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    file_content = "some specific content"
    (job_dir / "specific_file.txt").write_text(file_content)

    response = client.get(f"/api/jobs/{job_id}/files/specific_file.txt")
    assert response.status_code == 200
    assert response.text == file_content
    # The file should not be zipped, just plain text here
    # Starlette/FastAPI FileResponse tries to infer content type, but might not add it or sets application/octet-stream if unknown.

def test_download_single_file_not_found(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-job-file-miss"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    response = client.get(f"/api/jobs/{job_id}/files/missing_file.txt")
    assert response.status_code == 404

def test_get_job_cover_success(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-job-cover-success"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    # Create a dummy image file
    cover_file = job_dir / "cover.jpg"
    cover_file.write_text("dummy image data")

    response = client.get(f"/api/jobs/{job_id}/cover")
    assert response.status_code == 200
    assert response.text == "dummy image data"


def test_get_job_cover_not_found(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-job-cover-not-found"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    # No images here
    response = client.get(f"/api/jobs/{job_id}/cover")
    assert response.status_code == 404
    assert response.json() == {"detail": "Cover not found"}


def test_get_job_cover_invalid_job_id():
    response = client.get("/api/jobs/invalid..id/cover")
    assert response.status_code == 400


def test_get_job_cover_job_not_found(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    response = client.get("/api/jobs/nonexistent-job/cover")
    assert response.status_code == 404


def test_download_single_file_path_traversal(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    job_id = "test-job-file-trav"
    job_dir = data_dir / job_id
    job_dir.mkdir()

    # Create a file outside the job directory
    secret_file = data_dir / "secret.txt"
    secret_file.write_text("secret")

    # Try to access it
    # TestClient resolves ../ locally before sending, so we use %2E%2E to bypass it
    response = client.get(f"/api/jobs/{job_id}/files/%2E%2E/secret.txt")
    assert response.status_code == 403

def test_get_system_storage(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    response = client.get("/api/system/storage")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "used" in data
    assert "free" in data
    assert isinstance(data["total"], int)
    assert isinstance(data["used"], int)
    assert isinstance(data["free"], int)
