import asyncio
import json
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
HISTORY_FILE = DATA_DIR / "history.json"
LOGS_DIR = DATA_DIR / "logs"

# Ensure directories exist
try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
except PermissionError:
    logger.warning(f"Permission denied creating {DATA_DIR}. Tests might fail if data directory is required.")

# Lock for history file
history_lock = asyncio.Lock()

# Map job_id to running process
running_processes = {}


class JobRequest(BaseModel):
    url: HttpUrl


class JobResponse(BaseModel):
    id: str
    url: str
    status: str
    created_at: str
    error_log: Optional[str] = None
    files: Optional[int] = 0


async def read_history() -> List[Dict]:
    if not HISTORY_FILE.exists():
        return []
    try:
        async with history_lock:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error reading history: {e}")
        return []


async def write_history(history: List[Dict]):
    try:
        async with history_lock:
            with open(HISTORY_FILE, "w") as f:
                json.dump(history, f, indent=2)
    except Exception as e:
        logger.error(f"Error writing history: {e}")


async def update_job_status(job_id: str, status: str, error_log: Optional[str] = None, files: Optional[int] = None):
    history = await read_history()
    for job in history:
        if job["id"] == job_id:
            job["status"] = status
            if error_log is not None:
                job["error_log"] = error_log
            if files is not None:
                job["files"] = files
            break
    await write_history(history)


async def run_spotiflac(job_id: str, url: str):
    logger.info(f"Starting job {job_id} for URL {url}")

    # Check if job was already cancelled while queued
    history = await read_history()
    for job in history:
        if job["id"] == job_id and job["status"] == "Cancelled":
            logger.info(f"Job {job_id} was cancelled before starting.")
            return

    await update_job_status(job_id, "Running")

    log_file_path = LOGS_DIR / f"{job_id}.log"
    job_output_dir = DATA_DIR / job_id
    try:
        job_output_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create job output dir: {e}")
        await update_job_status(job_id, "Failed", error_log=str(e))
        return

    process = None
    try:
        with open(log_file_path, "w") as log_file:
            process = await asyncio.create_subprocess_exec(
                "uv", "run", "spotiflac", url, str(job_output_dir),
                stdout=log_file,
                stderr=asyncio.subprocess.STDOUT
            )

            running_processes[job_id] = process

            await process.wait()

            if process.returncode == 0:
                # Count files
                file_count = sum(1 for _ in job_output_dir.rglob("*") if _.is_file())
                await update_job_status(job_id, "Completed", files=file_count)
            elif process.returncode == -15: # Terminated
                logger.info(f"Job {job_id} was terminated.")
                # Status already updated by DELETE endpoint
            else:
                # Read last lines of log
                error_lines = ""
                with open(log_file_path, "r") as lf:
                    lines = lf.readlines()
                    error_lines = "".join(lines[-10:]) if lines else "Unknown error"
                await update_job_status(job_id, "Failed", error_log=error_lines)
    except asyncio.CancelledError:
        logger.info(f"Job task {job_id} was cancelled.")
    except Exception as e:
        logger.error(f"Job {job_id} failed to execute: {e}")
        await update_job_status(job_id, "Failed", error_log=str(e))
    finally:
        if job_id in running_processes:
            del running_processes[job_id]


@app.post("/api/jobs")
async def create_job(request: JobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    url_str = str(request.url)
    new_job = {
        "id": job_id,
        "url": url_str,
        "status": "Queued",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "error_log": None,
        "files": 0
    }

    history = await read_history()
    history.insert(0, new_job)
    await write_history(history)

    background_tasks.add_task(run_spotiflac, job_id, url_str)

    return new_job


@app.get("/api/jobs")
async def list_jobs():
    return await read_history()


@app.get("/api/jobs/{job_id}/log")
async def get_job_log(job_id: str):
    log_file_path = LOGS_DIR / f"{job_id}.log"
    if not log_file_path.exists() or not log_file_path.is_file():
        raise HTTPException(status_code=404, detail="Log not found")

    try:
        with open(log_file_path, "r") as f:
            return {"log": f.read()}
    except Exception as e:
        logger.error(f"Error reading log file for {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Error reading log")

@app.get("/api/jobs/{job_id}/files/{file_path:path}")
async def get_job_file(job_id: str, file_path: str):
    import re
    if not re.match(r"^[a-zA-Z0-9-]+$", job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job_dir = (DATA_DIR / job_id).resolve()

    if not job_dir.is_relative_to(DATA_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not job_dir.exists() or not job_dir.is_dir():
        raise HTTPException(status_code=404, detail="Job directory not found")

    target_file = (job_dir / file_path).resolve()
    if not target_file.is_relative_to(job_dir):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(target_file)


@app.get("/api/jobs/{job_id}/cover")
async def get_job_cover(job_id: str):
    import re
    # Strict validation of job_id to prevent path traversal
    if not re.match(r"^[a-zA-Z0-9-]+$", job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job_dir = (DATA_DIR / job_id).resolve()

    # Extra check to ensure job_dir is still within DATA_DIR
    if not job_dir.is_relative_to(DATA_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not job_dir.exists() or not job_dir.is_dir():
        raise HTTPException(status_code=404, detail="Job directory not found")

    try:
        # Search for common image formats
        for ext in ("*.jpg", "*.jpeg", "*.png"):
            for p in job_dir.rglob(ext):
                if p.is_file():
                    return FileResponse(p)

        raise HTTPException(status_code=404, detail="Cover not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding cover for {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Error finding cover")


@app.get("/api/jobs/{job_id}/files")
async def get_job_files(job_id: str):
    import re
    # Strict validation of job_id to prevent path traversal
    if not re.match(r"^[a-zA-Z0-9-]+$", job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job_dir = (DATA_DIR / job_id).resolve()

    # Extra check to ensure job_dir is still within DATA_DIR
    if not job_dir.is_relative_to(DATA_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not job_dir.exists() or not job_dir.is_dir():
        raise HTTPException(status_code=404, detail="Job directory not found")

    files = []
    try:
        for p in job_dir.rglob("*"):
            if p.is_file():
                # Get path relative to the job directory
                rel_path = p.relative_to(job_dir)
                files.append(str(rel_path))
        return {"files": sorted(files)}
    except Exception as e:
        logger.error(f"Error listing files for {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Error listing files")


@app.get("/api/jobs/{job_id}/progress")
async def get_job_progress(job_id: str):
    import re
    log_file_path = LOGS_DIR / f"{job_id}.log"
    if not log_file_path.exists() or not log_file_path.is_file():
        return None

    try:
        with open(log_file_path, "r") as f:
            log_content = f.read()

        matches = list(re.finditer(r"\[(\d+)/(\d+)\]", log_content))
        if not matches:
            return None

        last_match = matches[-1]
        current = int(last_match.group(1))
        total = int(last_match.group(2))

        track_name = None
        start_idx = last_match.end()

        # Find next track name indicator
        track_matches = list(re.finditer(r"↳\s*([^\n│]+)", log_content[start_idx:]))
        if track_matches:
            track_name = track_matches[-1].group(1).strip()

        return {
            "current": current,
            "total": total,
            "track": track_name,
            "percentage": int((current / total) * 100) if total > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error parsing progress for {job_id}: {e}")
        return None



@app.get("/api/jobs/{job_id}/download")
def download_job(job_id: str, background_tasks: BackgroundTasks):
    import re
    import shutil
    import tempfile
    import os

    if not re.match(r"^[a-zA-Z0-9-]+$", job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job_dir = (DATA_DIR / job_id).resolve()

    if not job_dir.is_relative_to(DATA_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not job_dir.exists() or not job_dir.is_dir():
        raise HTTPException(status_code=404, detail="Job directory not found")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    temp_file.close()

    base_name = temp_file.name[:-4]
    try:
        shutil.make_archive(base_name, 'zip', job_dir)
    except Exception:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise

    zip_path = temp_file.name

    background_tasks.add_task(os.unlink, zip_path)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"SpotiFLAC-{job_id}.zip"
    )

@app.get("/api/history/download")
def download_all_completed_jobs(background_tasks: BackgroundTasks):
    import shutil
    import tempfile
    import os
    import json

    history = []
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                pass

    completed_jobs = [job for job in history if job.get("status") == "Completed"]

    if not completed_jobs:
        raise HTTPException(status_code=404, detail="No completed jobs found")

    temp_dir = tempfile.mkdtemp()

    for job in completed_jobs:
        job_id = job["id"]
        job_dir = DATA_DIR / job_id
        if job_dir.exists() and job_dir.is_dir():
            target_dir = os.path.join(temp_dir, job_id)
            shutil.copytree(job_dir, target_dir)

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    temp_file.close()

    base_name = temp_file.name[:-4]
    try:
        shutil.make_archive(base_name, 'zip', temp_dir)
    except Exception:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    shutil.rmtree(temp_dir, ignore_errors=True)

    zip_path = temp_file.name

    background_tasks.add_task(os.unlink, zip_path)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename="SpotiFLAC-all-completed.zip"
    )

def _delete_job_files(job_id: str):
    import shutil
    job_dir = DATA_DIR / job_id
    if job_dir.exists() and job_dir.is_dir():
        shutil.rmtree(job_dir, ignore_errors=True)

@app.delete("/api/history/clear")
async def clear_history():
    history = []
    cleared_jobs = []
    async with history_lock:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)

        filtered_history = []
        for job in history:
            if job.get("status") in ["Queued", "Running"]:
                filtered_history.append(job)
            else:
                cleared_jobs.append(job["id"])

        with open(HISTORY_FILE, "w") as f:
            json.dump(filtered_history, f, indent=2)

    for job_id in cleared_jobs:
        log_file = LOGS_DIR / f"{job_id}.log"
        log_file.unlink(missing_ok=True)
        await asyncio.to_thread(_delete_job_files, job_id)

    return {"status": "success", "cleared": len(cleared_jobs)}

@app.delete("/api/history/clear-completed")
async def clear_completed_history():
    history = []
    cleared_jobs = []
    async with history_lock:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)

        filtered_history = []
        for job in history:
            if job.get("status") == "Completed":
                cleared_jobs.append(job["id"])
            else:
                filtered_history.append(job)

        with open(HISTORY_FILE, "w") as f:
            json.dump(filtered_history, f, indent=2)

    for job_id in cleared_jobs:
        log_file = LOGS_DIR / f"{job_id}.log"
        log_file.unlink(missing_ok=True)
        await asyncio.to_thread(_delete_job_files, job_id)

    return {"status": "success", "cleared": len(cleared_jobs)}

@app.delete("/api/history/clear-failed")
async def clear_failed_history():
    history = []
    cleared_jobs = []
    async with history_lock:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)

        filtered_history = []
        for job in history:
            if job.get("status") == "Failed":
                cleared_jobs.append(job["id"])
            else:
                filtered_history.append(job)

        with open(HISTORY_FILE, "w") as f:
            json.dump(filtered_history, f, indent=2)

    for job_id in cleared_jobs:
        log_file = LOGS_DIR / f"{job_id}.log"
        log_file.unlink(missing_ok=True)
        await asyncio.to_thread(_delete_job_files, job_id)

    return {"status": "success", "cleared": len(cleared_jobs)}

@app.delete("/api/jobs/{job_id}")
async def cancel_job(job_id: str):
    history = []
    delete_job_files_flag = False
    async with history_lock:
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)

        job_found = False
        new_history = []

        for job in history:
            if job["id"] == job_id:
                job_found = True
                if job["status"] in ["Queued", "Running"]:
                    job["status"] = "Cancelled"
                    new_history.append(job)
                else:
                    # Actually delete it from history
                    delete_job_files_flag = True
            else:
                new_history.append(job)

        if not job_found:
            raise HTTPException(status_code=404, detail="Job not found")

        with open(HISTORY_FILE, "w") as f:
            json.dump(new_history, f, indent=2)

    if job_id in running_processes:
        process = running_processes[job_id]
        try:
            process.terminate()
        except ProcessLookupError:
            pass

    if delete_job_files_flag:
        log_file = LOGS_DIR / f"{job_id}.log"
        log_file.unlink(missing_ok=True)
        await asyncio.to_thread(_delete_job_files, job_id)

    return {"status": "success"}

@app.get("/api/system/storage")
def get_system_storage():
    try:
        # Get disk usage for the configured DATA_DIR
        usage = shutil.disk_usage(DATA_DIR)
        return {
            "total": usage.total,
            "used": usage.used,
            "free": usage.free
        }
    except Exception as e:
        logger.error(f"Error checking storage usage: {e}")
        raise HTTPException(status_code=500, detail="Error checking storage usage")

# Serve frontend
FRONTEND_DIST = Path(__file__).parent / "website" / "dist"

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not FRONTEND_DIST.exists():
         return {"error": "Frontend not built yet"}

    file_path = (FRONTEND_DIST / full_path).resolve()
    # Prevent path traversal
    if not file_path.is_relative_to(FRONTEND_DIST.resolve()):
        raise HTTPException(status_code=403, detail="Forbidden")

    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Fallback to index.html for client-side routing
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail="Not Found")
