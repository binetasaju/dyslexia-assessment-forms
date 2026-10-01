#!/usr/bin/env bash
# Run this on macOS / Linux to set up (first time) and start the website:
#   ./start.sh
set -e
cd "$(dirname "$0")/backend"

PY=python3
command -v $PY >/dev/null 2>&1 || PY=python

if [ ! -d venv ]; then
  echo "Creating virtual environment..."
  $PY -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created backend/.env - edit it to turn on email."
fi

( sleep 2; (command -v xdg-open >/dev/null && xdg-open http://localhost:5000) || (command -v open >/dev/null && open http://localhost:5000) ) >/dev/null 2>&1 &
python app.py
