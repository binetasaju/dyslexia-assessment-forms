# How to Run — Child Assessment Tool

> **Purpose:** Run the Flask-backed assessment website locally on a laptop.  
> **Audience:** Assessors, researchers, and team members setting up the tool for the first time or on a new machine.

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| **Python** | 3.10 or newer (tested with 3.12). [Download](https://www.python.org/downloads/) |
| **Browser** | Google Chrome or Microsoft Edge (recommended). Firefox works too. |
| **Microphone** | Built-in or external mic required for audio tasks |
| **Internet** | Only needed during first-time install and for sending emails |

---

## Option A — One-Click Start (Recommended)

### Windows
Double-click **`start.bat`** in the project root.

### macOS / Linux
Open a terminal in the project folder and run:

```bash
chmod +x start.sh   # only needed once
./start.sh
```

The script will:
1. Create a Python virtual environment (`backend/venv/`) if one does not exist
2. Install all dependencies from `backend/requirements.txt`
3. Create `backend/.env` from the example file (first time only)
4. Start the Flask server
5. Open **http://localhost:5000** in the default browser automatically

---

## Option B — Manual Setup (Step by Step)

### Step 1 — Create a virtual environment

```bash
cd backend
python3 -m venv venv          # macOS / Linux
python  -m venv venv          # Windows
```

### Step 2 — Activate the virtual environment

```bash
# macOS / Linux
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

> If PowerShell blocks activation, run once:  
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

Dependencies installed:
- `Flask>=3.0,<4` — web server
- `python-dotenv>=1.0,<2` — loads `.env` configuration

### Step 4 — Create the environment file

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Open `backend/.env` in any text editor and fill in your values (see [Configuration](#configuration) below).

### Step 5 — Start the server

```bash
python app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

### Step 6 — Open the website

Open your browser and go to:
```
http://localhost:5000
```

> Always use `http://localhost:5000`. Do NOT open `index.html` directly — browsers only allow microphone access on `localhost`/HTTPS, and file saves require the backend.

### Step 7 — Stop the server

Press **Ctrl + C** in the terminal.

---

## Configuration

`backend/.env` controls all site behaviour. Key settings:

```ini
# Port (default: 5000)
PORT=5000

# Name shown in emails to identify which laptop sent data
STATION_NAME=Laptop-1

# ----------- Email -----------
ENABLE_EMAIL=true
ADMIN_EMAIL=researcher@example.com        # can be comma-separated
EMAIL_ATTACH_AUDIO=true                   # false = notification only
EMAIL_MAX_ATTACHMENT_MB=15                # Gmail safe limit

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your.project.account@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop        # 16-char Google App Password
EMAIL_FROM=                              # leave blank to use SMTP_USERNAME
```

> **Gmail App Password:** Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), create one called "Assessment tool", and paste the 16-character code. Your normal Gmail password will **not** work.

After editing `.env`, **restart the server** for changes to take effect.

---

## Test Email (Optional but Recommended)

With the virtual environment active and the server **not** running:

```bash
cd backend
python app.py --test-email
```

You should see `{'status': 'SENT', ...}` and receive a test email in `ADMIN_EMAIL`.

---

## Send Pending Emails

If email failed during an assessment (e.g., no internet), resend all unsent sessions:

```bash
cd backend
python app.py --send-pending
```

Or click **Send pending emails now** on the start page of the website.

---

## Microphone Permission

The browser asks for microphone permission the first time recording starts.

- Click **Allow** when the browser prompts.
- If you accidentally clicked **Block**: click the lock icon in the address bar → Microphone → **Allow** → reload the page.
- **Windows:** Settings → Privacy & security → Microphone → allow browser access.
- **macOS:** System Settings → Privacy & Security → Microphone → enable Chrome/Edge.

---

## Where Data is Saved

```
research_data/
    CH001/
        S01/
            session.json              ← all metadata (no audio data inside)
            reading/
                READING_R_8-10_S01.webm
            ran/
                RAN_NUM.webm
            memory/
                MEM_FWD_L3D_T1.webm
            CH001_S01.zip             ← what gets emailed
            email_status.json         ← SENT / FAILED
        S02/
            ...
```

All files are kept locally. Nothing is ever auto-deleted.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` not found (Windows) | Install Python from python.org and tick **"Add python.exe to PATH"**. Or use `py` instead of `python`. |
| PowerShell blocks `Activate.ps1` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then try again. |
| Port 5000 already in use | Set `PORT=5050` in `backend/.env` and open `http://localhost:5050`. |
| "The assessment server is not running" | The terminal/server was closed. Run `start.bat` / `./start.sh` again. |
| "Could not reach the assessment server" on Submit | Restart server without closing the browser tab, then click Submit again. |
| Microphone access error | See Microphone Permission above. Close Zoom/Teams if they are holding the mic. |
| Email: "login failed" | Use a **Gmail App Password**, not your normal password. Double-check `SMTP_USERNAME`. |
| Email: "Email is not configured" | A required `.env` value is empty. The error message names the field. Restart after fixing. |
| Email failed — no internet | Data is still saved locally. Use **Retry Email** on the success page or `--send-pending`. |
| Recording is silent | Check system input device. Use **Test Microphone** on the first page — the green bar should move when you speak. |

---

## Running on Multiple Laptops

1. Copy the project folder to each laptop (ZIP or git clone). The `.env`, `venv/`, and `research_data/` folders are **not** in git.
2. Share the filled-in `backend/.env` privately (USB / WhatsApp — never in a public repo).
3. Set a **unique `STATION_NAME`** on each laptop so you can tell which laptop sent each email.
4. Agree on **non-overlapping Child ID ranges** (e.g. Laptop-1: CH001–CH099, Laptop-2: CH100–CH199).
5. Each laptop saves independently and emails the same `ADMIN_EMAIL` inbox.

---

*For full protocol details see `README.md`. For question content and editing see section 9 of the README.*
