"""
ZIP creation and email delivery for submitted assessments.

The assessment is ALWAYS saved locally first. This module then:
  1. creates the ZIP file(s) inside the session folder (they stay on disk),
  2. emails the ZIP(s) to ADMIN_EMAIL,
  3. writes email_status.json in the session folder (SENT or FAILED).

Nothing in this module ever deletes or changes session.json or the audio files.
If the recordings are larger than EMAIL_MAX_ATTACHMENT_MB they are split into
several ZIPs / emails ("Part 1 of 3", ...).
"""

import json
import os
import smtplib
import ssl
import zipfile
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

STATUS_FILE = "email_status.json"
# "phonological" is kept only so older (v1) saved sessions are still zipped completely.
AUDIO_FOLDERS = ("reading", "phonological", "ran", "memory")


def _env_bool(name, default=False):
    value = os.getenv(name, str(default)).strip().lower()
    return value in ("1", "true", "yes", "on")


def get_config():
    username = os.getenv("SMTP_USERNAME", "").strip()
    recipients = [a.strip() for a in os.getenv("ADMIN_EMAIL", "").split(",") if a.strip()]
    try:
        max_mb = float(os.getenv("EMAIL_MAX_ATTACHMENT_MB", "15"))
    except ValueError:
        max_mb = 15.0
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError:
        port = 587
    return {
        "enabled": _env_bool("ENABLE_EMAIL", False),
        "attach_audio": _env_bool("EMAIL_ATTACH_AUDIO", True),
        "max_bytes": int(max_mb * 1024 * 1024),
        "recipients": recipients,
        "host": os.getenv("SMTP_HOST", "").strip(),
        "port": port,
        "username": username,
        # Gmail shows App Passwords with spaces ("abcd efgh ..."); remove them.
        "password": os.getenv("SMTP_PASSWORD", "").replace(" ", ""),
        "sender": os.getenv("EMAIL_FROM", "").strip() or username,
        "station": os.getenv("STATION_NAME", "").strip(),
    }


def config_problems(cfg):
    """Return a list of missing settings (empty list = configured)."""
    problems = []
    if not cfg["recipients"]:
        problems.append("ADMIN_EMAIL is empty")
    if not cfg["host"]:
        problems.append("SMTP_HOST is empty")
    if not cfg["username"]:
        problems.append("SMTP_USERNAME is empty")
    if not cfg["password"]:
        problems.append("SMTP_PASSWORD is empty")
    if not cfg["sender"]:
        problems.append("EMAIL_FROM is empty")
    return problems


def _connect(cfg):
    context = ssl.create_default_context()
    if cfg["port"] == 465:
        server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=context, timeout=30)
    else:
        server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=30)
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
    server.login(cfg["username"], cfg["password"])
    return server


# ------------------------------------------------------------------ status file
def read_status(session_dir: Path):
    path = Path(session_dir) / STATUS_FILE
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def is_sent(session_dir: Path):
    status = read_status(session_dir)
    return bool(status and status.get("status") == "SENT")


def _write_status(session_dir: Path, status, message, cfg, zip_names):
    previous = read_status(session_dir) or {}
    now = datetime.now().isoformat(timespec="seconds")
    data = {
        "status": status,                       # SENT | FAILED | NOT_CONFIGURED | DISABLED
        "message": message,
        "attempts": previous.get("attempts", 0) + (1 if status in ("SENT", "FAILED") else 0),
        "last_attempt_at": now,
        "sent_at": now if status == "SENT" else previous.get("sent_at"),
        "recipients": cfg["recipients"],
        "station_name": cfg["station"],
        "zip_files": zip_names,
        "audio_attached": cfg["attach_audio"],
    }
    (Path(session_dir) / STATUS_FILE).write_text(json.dumps(data, indent=2), encoding="utf-8")


# ------------------------------------------------------------------ ZIP files
def _collect_audio_files(session_dir: Path):
    files = []
    for folder in AUDIO_FOLDERS:
        sub = session_dir / folder
        if sub.is_dir():
            files += sorted(p for p in sub.iterdir() if p.is_file())
    return files


def _split_into_parts(files, max_bytes):
    """Greedy grouping of files so each group stays under max_bytes.
    Returns (parts, too_large) where too_large are single files above the limit."""
    parts, current, current_size, too_large = [], [], 0, []
    for f in files:
        size = f.stat().st_size
        if size > max_bytes:
            too_large.append(f)
            continue
        if current and current_size + size > max_bytes:
            parts.append(current)
            current, current_size = [], 0
        current.append(f)
        current_size += size
    if current:
        parts.append(current)
    return parts, too_large


def create_session_zips(session_dir: Path, cfg=None):
    """Create <CHILD>_<SESSION>.zip (or ..._part1of3.zip, ...) inside the session folder.

    Each ZIP contains session.json and the audio files in their folders.
    The ZIPs are kept on disk next to the original files (the originals are not touched).
    Returns {"zips": [{"name", "files"}], "too_large": [names]}.
    """
    cfg = cfg or get_config()
    session_dir = Path(session_dir)
    meta = json.loads((session_dir / "session.json").read_text(encoding="utf-8"))
    base = f"{meta['child_id']}_{meta['session']}"

    for old in session_dir.glob(f"{base}*.zip"):  # remove ZIPs from an earlier attempt only
        old.unlink()

    parts, too_large = _split_into_parts(_collect_audio_files(session_dir), cfg["max_bytes"])
    if not parts:
        parts = [[]]  # still produce a ZIP with session.json
    total = len(parts)
    zips = []
    for idx, part in enumerate(parts, start=1):
        name = f"{base}.zip" if total == 1 else f"{base}_part{idx}of{total}.zip"
        # Audio is already compressed, so ZIP_STORED is fast and just as small.
        with zipfile.ZipFile(session_dir / name, "w", compression=zipfile.ZIP_STORED) as zf:
            zf.write(session_dir / "session.json", "session.json")
            for f in part:
                zf.write(f, f.relative_to(session_dir).as_posix())
        zips.append({"name": name, "files": [f.relative_to(session_dir).as_posix() for f in part]})
    return {"zips": zips, "too_large": [f.relative_to(session_dir).as_posix() for f in too_large]}


# ------------------------------------------------------------------ email
def _body_text(meta, cfg, part_no, part_total, files_in_part, too_large, attach_audio):
    lines = [
        "A new assessment has been completed.",
        "",
        f"Child ID: {meta.get('child_id')}",
        f"Age: {meta.get('age')}",
        f"Gender: {meta.get('gender')}",
        f"Grade: {meta.get('grade') or '-'}",
        f"Category (research classification entered by assessor): {meta.get('category')}",
        f"Session: {meta.get('session')}",
        f"Assessment date: {meta.get('assessment_date') or '-'}",
        "",
        "Submission time:",
        str(meta.get("submitted_at", "")).replace("T", " ")[:16],
    ]
    if cfg["station"]:
        lines += ["", f"Sent from laptop: {cfg['station']}"]
    lines += ["", "The assessment metadata and audio recordings have been saved locally."]
    if attach_audio:
        lines += ["", f"Attachment: part {part_no} of {part_total}"]
        if files_in_part:
            lines.append("Audio files in this email:")
            lines += [f"  - {name}" for name in files_in_part]
        if too_large and part_no == 1:
            lines += ["", "These recordings were too large to email and are only on the laptop:"]
            lines += [f"  - {name}" for name in too_large]
    lines += ["", "This is an automated message from the assessment data-collection tool.",
              "It contains raw data and the assessor's marks only - no diagnosis."]
    return "\n".join(lines)


def send_assessment_email(session_dir: Path, force=False):
    """Create the ZIP(s) and email them for one saved session.

    force=True sends even when ENABLE_EMAIL=false (used by --send-pending).
    Returns {"status": "SENT" | "DISABLED" | "NOT_CONFIGURED" | "FAILED", "message": str, "zip_files": [...]}
    """
    cfg = get_config()
    session_dir = Path(session_dir)

    try:
        meta = json.loads((session_dir / "session.json").read_text(encoding="utf-8"))
        zip_info = create_session_zips(session_dir, cfg)
    except Exception as exc:  # noqa: BLE001
        return {"status": "FAILED", "message": f"Could not prepare the ZIP: {exc}", "zip_files": []}
    zip_names = [z["name"] for z in zip_info["zips"]]

    def finish(status, message):
        _write_status(session_dir, status, message, cfg, zip_names)
        return {"status": status, "message": message, "zip_files": zip_names}

    if not cfg["enabled"] and not force:
        return finish("DISABLED", "Email is turned off (ENABLE_EMAIL=false). The ZIP was saved locally.")

    problems = config_problems(cfg)
    if problems:
        return finish("NOT_CONFIGURED",
                      "Email is not configured: " + ", ".join(problems) + ". Edit backend/.env.")

    child_id, session = meta.get("child_id"), meta.get("session")
    base_subject = f"New Child Assessment Submitted – {child_id} – {session}"
    total = len(zip_info["zips"])

    messages = []
    if cfg["attach_audio"]:
        for idx, z in enumerate(zip_info["zips"], start=1):
            msg = EmailMessage()
            msg["Subject"] = base_subject if total == 1 else f"{base_subject} (Part {idx} of {total})"
            msg["From"] = cfg["sender"]
            msg["To"] = ", ".join(cfg["recipients"])
            msg.set_content(_body_text(meta, cfg, idx, total, z["files"], zip_info["too_large"], True))
            msg.add_attachment((session_dir / z["name"]).read_bytes(),
                               maintype="application", subtype="zip", filename=z["name"])
            messages.append(msg)
    else:
        msg = EmailMessage()
        msg["Subject"] = base_subject
        msg["From"] = cfg["sender"]
        msg["To"] = ", ".join(cfg["recipients"])
        msg.set_content(_body_text(meta, cfg, 1, 1, [], [], False))
        messages.append(msg)

    try:
        server = _connect(cfg)
        try:
            for msg in messages:
                server.send_message(msg)
        finally:
            try:
                server.quit()
            except Exception:  # noqa: BLE001
                pass
    except smtplib.SMTPAuthenticationError:
        return finish("FAILED", "Email login failed. Check SMTP_USERNAME / SMTP_PASSWORD "
                                "(for Gmail use a 16-character App Password).")
    except OSError as exc:
        return finish("FAILED", f"Could not connect to the email server (no internet?): {exc}")
    except Exception as exc:  # noqa: BLE001
        return finish("FAILED", f"Email could not be sent: {exc.__class__.__name__}: {exc}")

    count = len(messages)
    detail = f" with {', '.join(zip_names)}" if cfg["attach_audio"] else " (notification only)"
    return finish("SENT", f"Email sent to {', '.join(cfg['recipients'])}{detail} "
                          f"({count} email{'s' if count > 1 else ''}).")


def send_test_email():
    """Send a small test message so you can check the .env settings."""
    cfg = get_config()
    problems = config_problems(cfg)
    if problems:
        return {"status": "NOT_CONFIGURED", "message": ", ".join(problems)}
    msg = EmailMessage()
    msg["Subject"] = "Assessment tool – test email"
    msg["From"] = cfg["sender"]
    msg["To"] = ", ".join(cfg["recipients"])
    station = f" from {cfg['station']}" if cfg["station"] else ""
    msg.set_content(f"This is a test email{station}. Email settings are working.")
    try:
        server = _connect(cfg)
        server.send_message(msg)
        server.quit()
    except smtplib.SMTPAuthenticationError:
        return {"status": "FAILED", "message": "Login failed – use a Gmail App Password, not your normal password."}
    except Exception as exc:  # noqa: BLE001
        return {"status": "FAILED", "message": f"{exc.__class__.__name__}: {exc}"}
    return {"status": "SENT", "message": "Test email sent to " + ", ".join(cfg["recipients"])}
