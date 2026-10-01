# Child Assessment – Research Data Collection Tool

**Project:** AI-Based Multimodal Screening and Longitudinal Progress Tracking System for Dyslexia and Dysgraphia

This version is **only a data-collection website** (like a Google Form with an audio recorder and timers).
It does **not** score, predict or diagnose anything. The "Category" field is a research classification typed in by the assessor.

What it does:

1. Assessor enters Child ID, age, gender, category and session.
2. The correct age-group tasks are shown (5–7, 8–10, 11–13, 14–15).
3. Handwriting: instructions + passages + timer (photos of the sheets are taken separately, **not** uploaded).
4. Reading, Phonological Awareness, RAN and Memory: audio recording + timer + Complete/Skip.
5. Review page → **Submit Assessment**.
6. On **Submit Assessment** the backend, in this order:
   1. saves `session.json` and every audio file on the laptop in `research_data/<CHILD_ID>/<SESSION>/`,
   2. creates `<CHILD_ID>_<SESSION>.zip` in the same folder,
   3. emails the ZIP to `ADMIN_EMAIL` (subject `New Child Assessment Submitted – CH001 – S01`),
   4. writes `email_status.json` (`SENT` or `FAILED`).
7. The local files are **never deleted**, also after the email is sent. If the email fails (no internet, wrong password)
   the assessor sees *"Saved locally, but the email was NOT sent"* and can retry later.

---

## 1. Requirements

| Item | Version |
|---|---|
| Python | 3.10 or newer (tested with 3.12) |
| Browser | Google Chrome or Microsoft Edge (recommended). Firefox works too. |
| Microphone | Built-in laptop mic or a USB/headset mic |
| Internet | Only needed for installing (first time) and for sending email |

## 2. Project structure

```text
assessment_test/
├── start.bat               ← Windows: double-click to install + run
├── start.sh                ← macOS/Linux: ./start.sh to install + run
├── README.md
├── .gitignore
├── backend/
│   ├── app.py              ← Flask server (saves files, sends email)
│   ├── email_service.py    ← creates the ZIP and emails it
│   ├── requirements.txt
│   └── .env.example        ← copy to .env and fill in
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js              ← pages, navigation, review, submit
│       ├── assessment-data.js  ← ALL questions / passages / RAN / memory (edit this)
│       ├── timer.js            ← reusable Timer
│       └── recorder.js         ← reusable AudioRecorder
└── research_data/          ← saved assessments appear here
```

## 3. Quick start (easiest – for you and your friends)

**Windows:** double-click `start.bat`.

**macOS / Linux:** open a terminal in the project folder and run:

```bash
./start.sh
```

The script creates a virtual environment, installs the dependencies, creates `backend/.env` (first time only),
starts the server and opens **http://localhost:5000** in the browser.

## 4. Manual installation (exact commands)

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows (Command Prompt / PowerShell)
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install the dependencies and create the settings file:

```bash
pip install -r requirements.txt

# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Run:

```bash
python app.py
```

Open in Chrome/Edge:

```text
http://localhost:5000
```

Stop the server with **CTRL + C**.

> Always open the site through `http://localhost:5000`. Do **not** double-click `index.html`. Browsers only allow
> the microphone on `localhost`/HTTPS, and the page needs the backend to save files.

## 5. Microphone permission

- The first time you press **Start Recording** (or **Test Microphone** on the first page) the browser asks
  *"localhost wants to use your microphone"*. Click **Allow**.
- If you clicked **Block** by mistake: click the 🔒/camera icon left of the address bar → Microphone → **Allow** → reload the page.
- Windows: Settings → Privacy & security → Microphone → allow **desktop apps / browser** access.
- macOS: System Settings → Privacy & Security → Microphone → enable Chrome/Edge.

## 6. Where files are saved

```text
research_data/
    CH001/
        S01/
            session.json
            reading/
                reading_A.webm
                reading_B.webm
            phonological/
                PA1_Q01.webm
                PA1_Q02.webm
            ran/
                RAN_T01.webm
            memory/
                MEM_FORWARD_L1_Q01.webm
                MEM_BACKWARD_L1_Q01.webm
            CH001_S01.zip          ← session.json + all audio (the file that is emailed)
            email_status.json      ← SENT / FAILED, attempts, last error, time sent
        S02/
            ...
```

- **Audio**: `.webm` (Opus) in Chrome/Edge/Firefox. Safari records `.m4a`.
- **Metadata**: `session.json` in each session folder. It contains the child info, the passage chosen, timings,
  durations, the status of each question (`COMPLETED`, `SKIPPED`, `NOT_ATTEMPTED`) and the relative audio path. It has **no** correctness or score fields.
- If the same Child ID + Session is submitted twice, the website asks first. The older copy is **kept** as
  `S01_replaced_<date>_<time>`, never deleted.
- A different folder can be used by setting `RESEARCH_DATA_DIR=/path/to/folder` in `backend/.env`.

Example `session.json` (shortened):

```json
{
  "child_id": "CH001",
  "age": 8,
  "age_group": "8-10",
  "gender": "Male",
  "category": "Dyslexic",
  "category_note": "Research classification entered by the assessor. Not a diagnosis.",
  "session": "S01",
  "created_at": "2026-10-01T10:30:00",
  "submitted_at": "2026-10-01T11:02:13",
  "handwriting": {
    "H1": { "selected_passage": "1", "selected_text": "On Saturday morning, ...",
            "start_time": "2026-10-01T10:31:02", "end_time": "2026-10-01T10:32:27",
            "duration_seconds": 85.0, "status": "COMPLETED" }
  },
  "reading": {
    "A": { "passage_text": "Our school has ...", "file": "reading/reading_A.webm", "duration_seconds": 32.4, "status": "COMPLETED" },
    "B": { "passage_text": "It started raining ...", "status": "SKIPPED" }
  },
  "phonological_awareness": {
    "PA1": { "title": "Letter / Sound", "items": {
      "Q01": { "prompt": "sh", "file": "phonological/PA1_Q01.webm", "duration_seconds": 2.1, "status": "COMPLETED" } } }
  },
  "ran": { "T01": { "title": "Numbers", "stimuli": ["2","6","9"], "file": "ran/RAN_T01.webm", "duration_seconds": 25.3, "status": "COMPLETED" } },
  "memory": { "FORWARD": { "L1": { "Q01": { "level": "3 digits", "sequence": "4 – 8 – 2",
              "file": "memory/MEM_FORWARD_L1_Q01.webm", "duration_seconds": 3.0, "status": "COMPLETED" } } } },
  "assessor_notes": ""
}
```

## 7. Email (with recordings attached)

Every submission is **saved on the laptop first**. Then the ZIP is created and emailed automatically.
If email fails, nothing is lost:

- the success page shows **"Saved locally, but the email was NOT sent"**, the reason and a **Retry Email** button,
- the start page shows **"N saved assessments have not been emailed yet"** with a **Send pending emails now** button,
- `python app.py --send-pending` sends them from the command line,
- the server window prints `Waiting to be emailed: N session(s)` when it starts.

### 7.1 Gmail setup (recommended: one shared project Gmail account)

1. Create (or use) a Gmail account for the project, e.g. `dyslexia.project.team@gmail.com`.
2. Turn on **2-Step Verification** for that account (Google Account → Security).
3. Open <https://myaccount.google.com/apppasswords>, create an App Password called "Assessment tool" and copy
   the 16-character code. **Your normal Gmail password will not work.**
4. Edit `backend/.env`:

```ini
STATION_NAME=Laptop-1

ENABLE_EMAIL=true
ADMIN_EMAIL=the.address.that.should.receive.the.data@gmail.com
EMAIL_ATTACH_AUDIO=true
EMAIL_MAX_ATTACHMENT_MB=15

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=dyslexia.project.team@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=
```

`ADMIN_EMAIL` can hold several addresses separated by commas.

5. Test it (server does not need to be running):

```bash
cd backend
# activate venv first (see section 4)
python app.py --test-email
```

You should see `{'status': 'SENT', ...}` and receive a test email.

### 7.2 What the email contains

```text
Subject: New Child Assessment Submitted – CH001 – S01
Attachment: CH001_S01.zip   (session.json + all audio files, in their folders)

A new assessment has been completed.
Child ID: CH001
Age: 8
Gender: Male
Category (research classification entered by assessor): Dyslexic
Session: S01
Submission time: 2026-10-01 10:30
Sent from: Laptop-1
The assessment metadata and audio recordings have been saved locally.
```

- Gmail's limit is 25 MB per email. If the recordings are bigger than `EMAIL_MAX_ATTACHMENT_MB`, they are split into
  several ZIPs/emails: `CH001_S01_part1of3.zip` → subject `... (Part 1 of 3)`, and so on. Each part also contains `session.json`.
  A normal session (a few minutes of Opus audio) is about 1–5 MB, so it is usually one email.
- Set `EMAIL_ATTACH_AUDIO=false` to send only the short notification (audio stays on the laptop).
- Set `ENABLE_EMAIL=false` to switch email off completely. The website works the same.

### 7.3 No internet during the assessment?

The data is still saved. Later, when the laptop is online, send everything that was not emailed yet:

```bash
cd backend
python app.py --send-pending
```

Each session's `email_status.json` records the result. Sessions with `"status": "SENT"` are skipped;
everything else (`FAILED`, `NOT_CONFIGURED`, `DISABLED`, or a missing status file) is sent.
Instead of the command you can also click **Send pending emails now** on the start page.

## 8. Running it on your friends' laptops

Each laptop saves its **own** copy locally and emails the **same** administrator inbox.

1. Give your friend the project folder (ZIP or git). `.env`, `venv/` and `research_data/` are **not** included in git.
2. Send your friend the filled-in `backend/.env` **privately** (WhatsApp/USB, not in a public repo), or let them copy
   `.env.example` to `.env` and type in the same values.
3. Change `STATION_NAME` on each laptop (e.g. `Laptop-2`, `Friend-Ravi`) so you can tell which laptop sent each email.
4. Make sure each laptop uses **different Child IDs** (e.g. agree on ranges: Laptop-1 uses CH001–CH099, Laptop-2 uses CH100–CH199).
5. They run `start.bat` (Windows) or `./start.sh` (macOS/Linux) and run `python app.py --test-email` once.

## 9. Changing assessment content

All questions are in **`frontend/js/assessment-data.js`**. Save the file and reload the browser page. No server restart is needed.

- **Passages / sentences / prompts:** edit `text` in `handwriting.tasks[...].options` or `reading.passages`.
- **Phonological questions:** edit the `items` arrays under `phonological.sections`. Add a section by adding
  `{ id: "PA2", title: "...", instruction: "...", items: [...] }`. The `id` becomes the file name prefix (`PA2_Q01.webm`).
- **Memory sequences:** edit `memory.levels[...].sequences` (arrays of digits). Forward and backward use the same sequences.
- **Hide a module for an age group:** delete that module key (e.g. `ran`) from the age group.

### 9.1 Changing RAN stimuli

Each RAN task has a fixed `stimuli` list (shown left to right, top to bottom) and a `columns` value:

```javascript
{ id: "T01", title: "Objects", instruction: "...", columns: 5,
  stimuli: [ { display: "🍎", name: "apple" }, { display: "🐱", name: "cat" }, ... ] }
```

- `display` = what the child sees (emoji, digit or letter), `name` = expected name (shown only when the assessor ticks
  "Show expected names").
- For colours use `{ colour: "#d62828", name: "Red" }`.
- To use the official research **images**, put them in `frontend/images/` and use
  `display` text for now, or ask a developer to switch the cell to `<img src="images/...">` in `renderRan()` in `app.js`.

## 10. Adding Session 2 questions

Edit **`frontend/js/assessment-data.js`**, object `session2Data`. Each age group accepts the same modules, in the same
format, as `assessmentData`. For example:

```javascript
const session2Data = {
  placeholder: { title: "Follow-up Assessment", message: "Questions for Session 2 will be added here." },
  "5-7": {},
  "8-10": {
    reading: {
      instruction: "Please read this passage aloud.",
      passages: [ { id: "A", text: "Your follow-up passage here." } ],
    },
    memory: {
      levels: [ { id: "L1", label: "3 digits", sequences: [[1, 2, 3]] } ],
    },
  },
  "11-13": {},
  "14-15": {},
};
```

Any module you add appears automatically (with recording, timers, review and saving). Age groups that are still
empty show the placeholder page.

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| `python` not found (Windows) | Install Python from python.org and tick **"Add python.exe to PATH"**. Or use `py` instead of `python`. |
| `venv\Scripts\activate` blocked in PowerShell | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use Command Prompt. |
| "Address already in use" / port 5000 busy (macOS AirPlay uses 5000) | Set `PORT=5050` in `backend/.env` and open `http://localhost:5050`. |
| "Microphone access is required…" | See section 5. Also close Zoom/Teams if they are using the mic. |
| "The assessment server is not running" | The black server window was closed. Run `start.bat` / `python app.py` again. |
| Submit says "Could not reach the assessment server" | Restart the server **without closing the browser tab**, then click Submit again. Recordings live in the page until submitted. |
| Email: "login failed" | Use a Gmail **App Password** (section 7.1), not the normal password. Check `SMTP_USERNAME`. |
| Email: "Email is not configured" | A value in `.env` is empty. The message tells you which one. Restart the server after editing `.env`. |
| Email failed (no internet) | Data is saved. Use **Retry Email** later or `python app.py --send-pending`. |
| Recording is silent | Check the system input device and use **Test Microphone** on the first page (the green bar should move). |

## 12. Data protection and ethics (read before real use)

This tool records **children's voices**, which is sensitive personal data.

- Obtain **institutional ethics approval** and **written informed consent from parents/guardians** (and assent from
  the child) before collecting any real data. Follow your institution's and country's data-protection rules
  (for example India's DPDP Act 2023, or GDPR where applicable).
- Use **coded Child IDs only**. Never enter names, school names or other identifying information.
- The server listens on `127.0.0.1` only, so other computers on the network cannot open it. Recordings are never served over HTTP.
- **Emailing recordings sends child audio through a third-party email provider (e.g. Google).** Only enable
  `EMAIL_ATTACH_AUDIO=true` if your ethics approval allows it. Use a dedicated project account with 2-Step
  Verification and limit who can read the inbox. Set it to `false` to keep audio only on the laptop.
- Keep `backend/.env` private. Never commit it or put SMTP credentials in frontend code.
- Encrypt the laptop disk (BitLocker / FileVault), back up `research_data/` securely and delete data according to
  your approved retention plan.
- No audio is sent to any AI or external analysis service.
