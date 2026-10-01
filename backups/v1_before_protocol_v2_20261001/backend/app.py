"""
Assessment data-collection backend (Flask).

Runs only on this laptop (http://localhost:5000). It:
  1. serves the website in ../frontend
  2. saves session.json + audio recordings into ../research_data/<CHILD_ID>/<SESSION>/
  3. creates a ZIP of the session (kept on disk) and emails it to ADMIN_EMAIL
     (see email_service.py). Email failure never affects the saved files.

Usage:
  python app.py                 start the website
  python app.py --test-email    send a test email using backend/.env
  python app.py --send-pending  email every saved session that has not been emailed yet
"""

import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env")

import email_service  # noqa: E402  (needs .env loaded first)

FRONTEND_DIR = PROJECT_DIR / "frontend"
DATA_DIR = Path(os.getenv("RESEARCH_DATA_DIR", PROJECT_DIR / "research_data")).resolve()

CHILD_ID_RE = re.compile(r"^[A-Za-z0-9_-]{2,30}$")
SESSION_IDS = {"S01", "S02"}
GENDERS = {"Male", "Female", "Other"}
CATEGORIES = {"Dyslexic", "Dysgraphic", "Normal", "Other"}
AUDIO_FOLDERS = {"reading", "phonological", "ran", "memory"}
AUDIO_PATH_RE = re.compile(r"^(reading|phonological|ran|memory)/[A-Za-z0-9_-]{1,80}\.(webm|ogg|mp4|m4a|wav)$")

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024  # 1 GB per submission


# ----------------------------------------------------------------- website
@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:filename>")
def frontend_files(filename):
    # Only the frontend folder is served. Recordings are never served over HTTP.
    return send_from_directory(FRONTEND_DIR, filename)


# --------------------------------------------------------------------- API
def error(message, code=400, **extra):
    return jsonify({"ok": False, "error": message, **extra}), code


def saved_sessions():
    if not DATA_DIR.exists():
        return []
    return sorted(p.parent for p in DATA_DIR.glob("*/S0[12]/session.json"))


def pending_sessions():
    """Saved sessions whose email has not been sent successfully yet."""
    return [d for d in saved_sessions() if not email_service.is_sent(d)]


@app.get("/api/status")
def status():
    cfg = email_service.get_config()
    return jsonify({
        "ok": True,
        "email_enabled": cfg["enabled"],
        "email_configured": not email_service.config_problems(cfg),
        "email_attach_audio": cfg["attach_audio"],
        "station_name": cfg["station"],
        "pending_emails": len(pending_sessions()) if cfg["enabled"] else 0,
    })


def collect_referenced_files(node, found):
    """Find every "file" value anywhere inside the metadata."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "file" and isinstance(value, str):
                found.add(value)
            else:
                collect_referenced_files(value, found)
    elif isinstance(node, list):
        for value in node:
            collect_referenced_files(value, found)
    return found


def validate_metadata(meta):
    if not isinstance(meta, dict):
        return "Metadata is missing or invalid."
    child_id = str(meta.get("child_id", "")).strip()
    if not CHILD_ID_RE.match(child_id):
        return "Invalid Child ID. Use 2–30 letters, numbers, '-' or '_' (e.g. CH001)."
    try:
        age = int(meta.get("age"))
    except (TypeError, ValueError):
        return "Age is missing."
    if not 5 <= age <= 15:
        return "Age must be between 5 and 15."
    if meta.get("gender") not in GENDERS:
        return "Gender is missing."
    if meta.get("category") not in CATEGORIES:
        return "Category is missing."
    if meta.get("session") not in SESSION_IDS:
        return "Session is missing."
    return None


@app.post("/api/submit")
def submit():
    raw = request.form.get("metadata")
    if not raw:
        return error("No assessment data was received.")
    try:
        meta = json.loads(raw)
    except json.JSONDecodeError:
        return error("Assessment data could not be read.")

    problem = validate_metadata(meta)
    if problem:
        return error(problem)

    meta["child_id"] = meta["child_id"].strip().upper()
    child_id, session = meta["child_id"], meta["session"]
    meta["submitted_at"] = datetime.now().isoformat(timespec="seconds")
    meta["station_name"] = os.getenv("STATION_NAME", "").strip()

    # Check uploaded files: names must be predictable, safe relative paths.
    uploads = {}
    for field_name in request.files:
        if not AUDIO_PATH_RE.match(field_name):
            return error(f"Unexpected file name: {field_name}")
        uploads[field_name] = request.files[field_name]

    referenced = collect_referenced_files(meta, set())
    missing = sorted(referenced - set(uploads))
    if missing:
        return error("Some recordings did not arrive: " + ", ".join(missing))

    child_dir = DATA_DIR / child_id
    final_dir = child_dir / session
    overwrite = request.form.get("overwrite") == "true"
    if final_dir.exists() and not overwrite:
        return error(f"{child_id} {session} has already been submitted on this laptop.",
                     409, already_exists=True)

    # Write everything into a temporary folder first, then rename it.
    # That way a half-finished save never looks like a complete session.
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tmp_dir = child_dir / f".{session}_saving_{stamp}"
    try:
        tmp_dir.mkdir(parents=True, exist_ok=False)
        for folder in AUDIO_FOLDERS:
            (tmp_dir / folder).mkdir()
        for rel_path, storage in uploads.items():
            storage.save(tmp_dir / rel_path)
        (tmp_dir / "session.json").write_text(
            json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

        backup_name = None
        if final_dir.exists():
            # Keep the previous submission instead of deleting it.
            backup_name = f"{session}_replaced_{stamp}"
            final_dir.rename(child_dir / backup_name)
        tmp_dir.rename(final_dir)
    except Exception as exc:  # noqa: BLE001
        shutil.rmtree(tmp_dir, ignore_errors=True)
        app.logger.error("Saving failed: %s", exc.__class__.__name__)
        return error(f"The assessment could not be saved on this laptop: {exc}", 500)

    # The assessment is now safely on disk. Create the ZIP and email it.
    # Nothing below can delete or change the saved files.
    try:
        email_result = email_service.send_assessment_email(final_dir)
    except Exception as exc:  # noqa: BLE001
        email_result = {"status": "FAILED", "message": f"Unexpected email error: {exc}", "zip_files": []}
    print(f"[submit] {child_id} {session} saved ({len(uploads)} audio files) – email: {email_result['status']}", flush=True)

    return jsonify({
        "ok": True,
        "child_id": child_id,
        "session": session,
        "folder": str(final_dir),
        "audio_files": len(uploads),
        "previous_moved_to": backup_name,
        "email": email_result,
    })


@app.post("/api/send-email")
def send_email():
    body = request.get_json(silent=True) or {}
    child_id = str(body.get("child_id", "")).strip().upper()
    session = body.get("session")
    if not CHILD_ID_RE.match(child_id) or session not in SESSION_IDS:
        return error("Invalid Child ID or session.")
    session_dir = DATA_DIR / child_id / session
    if not (session_dir / "session.json").exists():
        return error("This session has not been saved yet.", 404)
    result = email_service.send_assessment_email(session_dir)
    print(f"[retry email] {child_id} {session} – {result['status']}", flush=True)
    return jsonify({"ok": result["status"] in ("SENT", "DISABLED"), **result})


@app.post("/api/send-pending")
def api_send_pending():
    """Retry every saved session that has not been emailed yet (button on the start page)."""
    results = []
    for session_dir in pending_sessions():
        result = email_service.send_assessment_email(session_dir, force=True)
        results.append({"child_id": session_dir.parent.name, "session": session_dir.name, **result})
    remaining = len(pending_sessions())
    print(f"[send pending] {len(results)} tried, {remaining} still pending", flush=True)
    return jsonify({"ok": True, "results": results, "remaining": remaining})


# --------------------------------------------------------------------- CLI
def send_pending():
    """Email every saved session whose email_status.json is not SENT."""
    pending = pending_sessions()
    if not pending:
        print("Nothing to send – every saved session has already been emailed.")
        return
    print(f"{len(pending)} session(s) waiting to be emailed.")
    failed = 0
    for session_dir in pending:
        result = email_service.send_assessment_email(session_dir, force=True)
        failed += result["status"] != "SENT"
        print(f"  {session_dir.parent.name} {session_dir.name}: {result['status']} – {result['message']}")
    print("Done." if not failed else f"{failed} still not sent – the files are safe, try again later.")


def print_startup_info():
    cfg = email_service.get_config()
    port = int(os.getenv("PORT", "5000"))
    print("=" * 60)
    print(" Child Assessment – data collection tool")
    print(f" Open in Chrome/Edge:  http://localhost:{port}")
    print(f" Data folder:          {DATA_DIR}")
    if cfg["enabled"]:
        problems = email_service.config_problems(cfg)
        if problems:
            print(" Email:                ON but NOT configured (" + ", ".join(problems) + ")")
        else:
            audio = "with audio attached" if cfg["attach_audio"] else "notification only"
            print(f" Email:                ON ({audio}) -> {', '.join(cfg['recipients'])}")
    else:
        print(" Email:                OFF (ENABLE_EMAIL=false)")
    if cfg["station"]:
        print(f" Station name:         {cfg['station']}")
    pending = pending_sessions()
    if cfg["enabled"] and pending:
        print(f" Waiting to be emailed: {len(pending)} session(s) – run: python app.py --send-pending")
    print(" Press CTRL+C to stop.")
    print("=" * 60)


if __name__ == "__main__":
    if "--test-email" in sys.argv:
        print(email_service.send_test_email())
        sys.exit(0)
    if "--send-pending" in sys.argv:
        send_pending()
        sys.exit(0)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print_startup_info()
    # 127.0.0.1 = only this laptop can open the site; recordings never leave it
    # except through the optional email.
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
