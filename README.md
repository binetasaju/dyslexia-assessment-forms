# Child Assessment – Research Data Collection Tool

**Project:** AI-Based Multimodal Screening and Longitudinal Progress Tracking System for Dyslexia and Dysgraphia

This is a **raw data collection website** only. It saves audio, times and the assessor's simple marks.
It does **not** calculate any score, percentage or speed, and does not predict or diagnose anything.
The "Category" field is a research classification typed in by the assessor.

What it does (protocol v2 – content in `frontend/js/assessment-data.js`, decisions and open points in `PROTOCOL_REVIEW.md`):

1. Assessor enters Child ID, age, gender, grade, category, session and date.
2. The age-group (5–7, 8–10, 11–13, 14–15) and session (1 or 2) content is shown, one step per task:

   | Task | Audio | What is saved |
   |---|---|---|
   | Handwriting – Copying (text shown on screen) | no | text, start/end time, duration, Completed/Not completed |
   | Handwriting – Dictation (ASSESSOR ONLY) | no | sentence, start/end time, duration, status |
   | Reading | **yes** | passage, audio, recording start/end/duration |
   | Phonological Awareness (ASSESSOR ONLY) | no | per question: child's response + mark Correct (1) / Incorrect (0) / Not attempted (null) |
   | Grapheme–Phoneme Knowledge (5–7 Session 2, ASSESSOR ONLY) | no | same as phonological awareness, saved separately |
   | RAN (Session 1 and 2) | **yes** | grid used, audio, recording start/end/duration |
   | Memory (ASSESSOR ONLY; S1 forward, S2 backward) | **yes** | per trial: target sequence, audio, recording times |

3. Review page → **Submit Assessment**.
4. On **Submit Assessment** the backend, in this order:
   1. saves `session.json` and every audio file on the laptop in `research_data/<CHILD_ID>/<SESSION>/`,
   2. creates `<CHILD_ID>_<SESSION>.zip` in the same folder,
   3. emails the ZIP to `ADMIN_EMAIL` (subject `New Child Assessment Submitted – CH001 – S01`),
   4. writes `email_status.json` (`SENT` or `FAILED`).
5. The local files are **never deleted**, also after the email is sent. If the email fails (no internet, wrong password)
   the assessor sees *"Saved locally, but the email was NOT sent"* and can retry later.

Assessor-only screens (dictation, phonological, grapheme–phoneme, memory) first show a big
**ASSESSOR ONLY – Do not show this screen to the child** warning, which stays as a red bar at the top of the task.
On every task the assessor instructions are in a small box on the left; the task itself is in the centre.

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
├── PROTOCOL_REVIEW.md      ← protocol inconsistencies + what the researcher must confirm
├── .gitignore
├── backups/                ← copy of the previous (v1) version
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
│       ├── assessment-data.js  ← ALL questions / passages / RAN / memory per age + session (edit this)
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
                READING_R_8-10_S01.webm
            ran/
                RAN_NUM.webm
            memory/
                MEM_FWD_L3D_T1.webm     ← Session 1 (forward)
                MEM_BWD_L3D_T1.webm     ← Session 2 (backward)
            CH001_S01.zip          ← session.json + all audio (the file that is emailed)
            email_status.json      ← SENT / FAILED, attempts, last error, time sent
        S02/
            ...
```

- **Audio**: `.webm` (Opus) in Chrome/Edge/Firefox. Safari records `.m4a`.
- **Metadata**: `session.json` in each session folder: child info, the exact texts/questions/grid used, start/end time
  and duration of everything, the assessor's marks, and the relative audio paths. Nothing is calculated.
  - Question marks (phonological / grapheme–phoneme only): `CORRECT` (score 1), `INCORRECT` (score 0),
    `NOT_ATTEMPTED` (score `null`, never 0), `NOT_MARKED` (assessor did not mark it, score `null`).
  - Handwriting status: `COMPLETED`, `NOT_COMPLETED`, `NOT_MARKED`.
- No audio is recorded for phonological awareness, grapheme–phoneme knowledge or handwriting.
- If the same Child ID + Session is submitted twice, the website asks first. The older copy is **kept** as
  `S01_replaced_<date>_<time>`, never deleted.
- A different folder can be used by setting `RESEARCH_DATA_DIR=/path/to/folder` in `backend/.env`.

Example `session.json` (shortened):

```json
{
  "schema_version": "2.1", "protocol_version": "2.1",
  "child_id": "CH001", "age": 8, "age_group": "8-10", "gender": "Male", "grade": "3",
  "category": "Dyslexic", "category_note": "Research classification entered by the assessor. Not a diagnosis.",
  "session": "S01", "assessment_date": "2026-10-01",
  "handwriting": {
    "copying":   { "text_id": "HW_8-10_S01_COPY", "text": "On Saturday morning, ...", "start_time": "2026-10-01T10:31:02",
                   "end_time": "2026-10-01T10:32:27", "duration_seconds": 85.0, "status": "COMPLETED" },
    "dictation": { "text_id": "HW_8-10_S01_DICT", "text": "The boy helped ...", "duration_seconds": 42.0,
                   "status": "COMPLETED", "times_sentence_read": 2 }
  },
  "reading": { "passage_id": "R_8-10_S01", "passage_title": "The School Garden", "passage_text": "Our school has ...",
               "audio_file": "reading/READING_R_8-10_S01.webm", "recording_start_time": "2026-10-01T10:35:10",
               "recording_end_time": "2026-10-01T10:36:02", "recording_duration_seconds": 52.0 },
  "phonological_awareness": { "sections": [ { "section_id": "RHYME", "title": "Rhyme", "items": [
      { "question_id": "Q1", "question": "Which word rhymes with light?", "options": ["A. Late", "B. Night", "C. Lot", "D. Let"],
        "expected_answer_protocol": "Night.", "raw_response": "night", "status": "CORRECT", "score": 1 } ] } ] },
  "grapheme_phoneme_knowledge": null,
  "ran": { "tasks": [ { "task_id": "NUM", "grid_id": "RAN_8-10_NUMBERS_V1",
           "grid_source": "IMPLEMENTATION_CREATED from the protocol's stimulus categories (...)", "grid_rows": 5, "grid_columns": 10,
           "grid_items": ["9", "6", "4", "..."], "audio_file": "ran/RAN_NUM.webm", "recording_duration_seconds": 31.0 } ] },
  "memory": {
    "forward":  { "administered": true, "condition": "FORWARD", "trials": [
      { "level": "L3D", "level_label": "3 digits", "trial": 1, "target_sequence": [4, 8, 2],
        "audio_file": "memory/MEM_FWD_L3D_T1.webm", "recording_duration_seconds": 4.2 } ] },
    "backward": { "administered": false, "note": "Backward recall is administered in the other session." }
  },
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
Grade: 3
Category (research classification entered by assessor): Dyslexic
Session: S01
Assessment date: 2026-10-01
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

All questions are in **`frontend/js/assessment-data.js`**, organised as
`assessmentData["8-10"].S01.reading` (age group → session → module). Save the file and reload the browser page.
No server restart is needed.

- **Handwriting:** `handwriting.copying.text` / `handwriting.dictation.text` (keep or change the `text_id`).
- **Reading:** `reading.title`, `reading.text`, `reading.passage_id`.
- **Phonological questions:** `phonological.sections[].items[]`, built with two helpers. Copy the protocol wording exactly:
  - `mc("Q1", "Which word rhymes with cat?", ["Sun", "Hat", "Dog", "Pen"], "Hat")` – multiple choice
  - `item("Q5", "Say cat without /k/.", "at")` – any other question; leave out the answer (or use `null`) when the
    protocol gives none. The expected answer is only shown to the assessor; the assessor always decides the mark.
  - a section can have `say: "Ask: ..."` for a shared instruction.
- **Grapheme–phoneme items:** `grapheme_phoneme.sections` (same format; `child_display` = the letter shown to the child).
- **Memory:** `memory: { condition: "FORWARD" | "BACKWARD", levels: [...] }`, sequences are arrays of digits.
- **Add or remove a task:** add or delete the module key in that session.
- The `id` values become audio file names – use only letters, numbers, `_` and `-`, unique within the module.

After editing, you can print every age group/session to check it:
`node -e "const d=require('./frontend/js/assessment-data.js'); console.log(JSON.stringify(d.assessmentData['8-10'].S02, null, 1))"`

## 10. RAN grids

Each age group has one fixed grid (`RAN_5_7`, `RAN_8_10`, `RAN_11_13`, `RAN_14_15` in `assessment-data.js`), used in
both sessions. `items` is the list read left → right, top → bottom; `columns` sets the row length. Items are drawn as
emoji (`RAN_EMOJI`), coloured circles (`RAN_COLOURS`) or the text itself (digits/letters).
If you change a grid, also change its `grid_id` (e.g. `..._V2`) so saved sessions show which grid was used.
The grids are implementation-created from the protocol's stimulus categories (confirmed for use); their design is
recorded in `PROTOCOL_REVIEW.md` section 2. Each session saves the grid id, source and full item list.

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
