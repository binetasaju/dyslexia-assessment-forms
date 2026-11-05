# RUN.md — Start the Assessment Website

## Every time (normal start)

Open a terminal in the project root (`assessment_test/`) and run:

```bash
cd backend
venv/bin/python app.py
```

Then open in **Chrome or Edge**:

```
http://localhost:5000
```

The Flask server serves both the **backend API** and the **frontend website** — no separate frontend command is needed.

---

## First time only (one-time setup)

Run these once to create the virtual environment and install dependencies:

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Then start normally:

```bash
venv/bin/python app.py
```

Open **http://localhost:5000** in Chrome or Edge.

---

## Stop the server

Press **Ctrl + C** in the terminal.

---

## Useful extras

```bash
# Test email is working
venv/bin/python app.py --test-email

# Resend any emails that failed (e.g. no internet during assessment)
venv/bin/python app.py --send-pending
```
