import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
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
    await update_job_status(job_id, "Running")

    log_file_path = LOGS_DIR / f"{job_id}.log"
    job_output_dir = DATA_DIR / job_id
    try:
        job_output_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create job output dir: {e}")
        await update_job_status(job_id, "Failed", error_log=str(e))
        return

    try:
        with open(log_file_path, "w") as log_file:
            process = await asyncio.create_subprocess_exec(
                "uv", "run", "spotiflac", url, str(job_output_dir),
                stdout=log_file,
                stderr=asyncio.subprocess.STDOUT
            )

            await process.wait()

            if process.returncode == 0:
                # Count files
                file_count = sum(1 for _ in job_output_dir.rglob("*") if _.is_file())
                await update_job_status(job_id, "Completed", files=file_count)
            else:
                # Read last lines of log
                error_lines = ""
                with open(log_file_path, "r") as lf:
                    lines = lf.readlines()
                    error_lines = "".join(lines[-10:]) if lines else "Unknown error"
                await update_job_status(job_id, "Failed", error_log=error_lines)
    except Exception as e:
        logger.error(f"Job {job_id} failed to execute: {e}")
        await update_job_status(job_id, "Failed", error_log=str(e))


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
