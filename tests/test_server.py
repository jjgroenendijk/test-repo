from httpx import AsyncClient
from server import running_processes, LOGS_DIR

from httpx import ASGITransport
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
    assert "completed_at" not in data or data["completed_at"] is None

    # Verify it was added to history
    response = client.get("/api/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) == 1
    assert jobs[0]["id"] == data["id"]
    assert "completed_at" not in jobs[0] or jobs[0]["completed_at"] is None

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
    assert "completed_at" in jobs[0]
    assert isinstance(jobs[0]["completed_at"], str)

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

def test_clear_cancelled_history():
    import json

    # Write some dummy jobs directly to history file
    dummy_history = [
        {"id": "job-1", "url": "https://open.spotify.com/track/abc", "status": "Cancelled"},
        {"id": "job-2", "url": "https://open.spotify.com/track/def", "status": "Completed"},
        {"id": "job-3", "url": "https://open.spotify.com/track/ghi", "status": "Cancelled"},
        {"id": "job-4", "url": "https://open.spotify.com/track/jkl", "status": "Running"}
    ]
    with open(HISTORY_FILE, "w") as f:
        json.dump(dummy_history, f)

    resp = client.delete("/api/history/clear-cancelled")
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
    assert "Cancelled" not in statuses

def test_clear_completed_history():
    import json

    # Write some dummy jobs directly to history file
    dummy_history = [
        {"id": "job-1", "url": "https://open.spotify.com/track/abc", "status": "Failed"},
        {"id": "job-2", "url": "https://open.spotify.com/track/def", "status": "Completed"},
        {"id": "job-3", "url": "https://open.spotify.com/track/ghi", "status": "Failed"},
        {"id": "job-4", "url": "https://open.spotify.com/track/jkl", "status": "Running"},
        {"id": "job-5", "url": "https://open.spotify.com/track/mno", "status": "Completed"}
    ]
    with open(HISTORY_FILE, "w") as f:
        json.dump(dummy_history, f)

    resp = client.delete("/api/history/clear-completed")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["cleared"] == 2

    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    remaining_jobs = resp.json()

    assert len(remaining_jobs) == 3
    statuses = [j["status"] for j in remaining_jobs]
    assert "Failed" in statuses
    assert "Running" in statuses
    assert "Completed" not in statuses

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

def test_download_all_completed_jobs(tmp_path, monkeypatch):
    import zipfile
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    history_file = tmp_path / "history.json"
    monkeypatch.setattr("server.HISTORY_FILE", history_file)

    job1_id = "test-job-1"
    job2_id = "test-job-2"
    job3_id = "test-job-failed"

    history_data = [
        {"id": job1_id, "status": "Completed"},
        {"id": job2_id, "status": "Completed"},
        {"id": job3_id, "status": "Failed"},
    ]
    with open(history_file, "w") as f:
        json.dump(history_data, f)

    job1_dir = data_dir / job1_id
    job1_dir.mkdir(parents=True)
    (job1_dir / "file1.txt").write_text("job1 content")

    job2_dir = data_dir / job2_id
    job2_dir.mkdir(parents=True)
    (job2_dir / "file2.txt").write_text("job2 content")

    job3_dir = data_dir / job3_id
    job3_dir.mkdir(parents=True)
    (job3_dir / "failed.txt").write_text("failed content")

    response = client.get("/api/history/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "filename=\"SpotiFLAC-all-completed.zip\"" in response.headers["content-disposition"]

    zip_path = tmp_path / "temp.zip"
    zip_path.write_bytes(response.content)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        files = zip_ref.namelist()
        assert f"{job1_id}/file1.txt" in files
        assert f"{job2_id}/file2.txt" in files
        assert f"{job3_id}/failed.txt" not in files

def test_download_all_completed_jobs_no_jobs(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("server.DATA_DIR", data_dir)

    history_file = tmp_path / "history.json"
    monkeypatch.setattr("server.HISTORY_FILE", history_file)

    history_data = [
        {"id": "test-job-failed", "status": "Failed"},
    ]
    with open(history_file, "w") as f:
        json.dump(history_data, f)

    response = client.get("/api/history/download")
    assert response.status_code == 404
    assert response.json()["detail"] == "No completed jobs found"

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

def test_get_stats_empty(tmp_path, monkeypatch):
    history_file = tmp_path / "history.json"
    monkeypatch.setattr("server.HISTORY_FILE", history_file)

    response = client.get("/api/stats")
    assert response.status_code == 200
    assert response.json() == {"total_jobs": 0, "total_files": 0, "success_rate": 0}

def test_get_stats_with_data(tmp_path, monkeypatch):
    history_file = tmp_path / "history.json"
    monkeypatch.setattr("server.HISTORY_FILE", history_file)

    history_data = [
        {"id": "job-1", "status": "Completed", "files": 5},
        {"id": "job-2", "status": "Failed", "files": 0},
        {"id": "job-3", "status": "Running"},
        {"id": "job-4", "status": "Completed", "files": 2},
    ]
    with open(history_file, "w") as f:
        json.dump(history_data, f)

    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_jobs"] == 4
    assert data["total_files"] == 7
    # 2 completed, 1 failed, 1 running
    # Finished = 3, Completed = 2 -> 2/3 * 100 = 67%
    assert data["success_rate"] == 67
@pytest.mark.anyio
async def test_cancel_all_jobs(clean_history, monkeypatch):
    monkeypatch.setattr("server.run_spotiflac", lambda job_id, url: None)
    # Queue a job
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res1 = await client.post("/api/jobs", json={"url": "https://open.spotify.com/track/1234"})
        assert res1.status_code == 200
        job1_id = res1.json()["id"]

        res2 = await client.post("/api/jobs", json={"url": "https://open.spotify.com/track/5678"})
        assert res2.status_code == 200
        job2_id = res2.json()["id"]

    # Simulate them running
    running_processes[job1_id] = type("MockProcess", (), {"terminate": lambda self: None})()
    running_processes[job2_id] = type("MockProcess", (), {"terminate": lambda self: None})()

    # Add fake logs to ensure they are NOT deleted
    log1 = LOGS_DIR / f"{job1_id}.log"
    log1.write_text("log 1")
    log2 = LOGS_DIR / f"{job2_id}.log"
    log2.write_text("log 2")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res_cancel = await client.post("/api/jobs/cancel-all")
        assert res_cancel.status_code == 200
        assert res_cancel.json()["cancelled"] == 2

        res_list = await client.get("/api/jobs")
        jobs = res_list.json()
        assert len(jobs) == 2
        assert all(j["status"] == "Cancelled" for j in jobs)

    # Check logs are NOT deleted
    assert log1.exists()
    assert log2.exists()
