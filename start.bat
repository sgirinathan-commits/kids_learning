@echo off
REM Starts Captain Leap's Word Quest on http://localhost:8080
REM (A local server is needed so the browser lets the app use the microphone.)
cd /d "%~dp0"
start "" http://localhost:8080
python -m http.server 8080
