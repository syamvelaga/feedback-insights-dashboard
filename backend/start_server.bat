@echo off
echo Starting Feedback Insights Backend Server...
echo.

REM Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call .venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Installing dependencies globally...
)

echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting server on http://127.0.0.1:5000
echo Press Ctrl+C to stop the server
echo.

python main_new.py

pause
