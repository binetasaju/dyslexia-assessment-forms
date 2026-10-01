@echo off
REM Double-click this file on Windows to set up (first time) and start the website.
cd /d "%~dp0backend"

where python >nul 2>nul
if errorlevel 1 (
  echo Python is not installed. Install Python 3.10+ from https://www.python.org/downloads/
  echo IMPORTANT: tick "Add python.exe to PATH" during installation.
  pause
  exit /b 1
)

if not exist venv (
  echo Creating virtual environment...
  python -m venv venv
)
call venv\Scripts\activate
pip install -q -r requirements.txt

if not exist .env (
  copy .env.example .env >nul
  echo Created backend\.env - edit it to turn on email.
)

start "" /b cmd /c "timeout /t 3 >nul & start http://localhost:5000"
python app.py
pause
