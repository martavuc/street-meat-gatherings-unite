@echo off

REM Street Meat Event Backend Startup Script for Windows

echo 🌮 Starting Street Meat Event Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Set default database URL if not set
if "%DATABASE_URL%"=="" (
    echo Setting default SQLite database URL...
    set DATABASE_URL=sqlite:///./streetmeat.db
)

REM Seed database
echo Seeding database...
python seed_data.py

REM Start the server
echo Starting FastAPI server on http://localhost:8000
echo API documentation available at http://localhost:8000/docs
echo Press Ctrl+C to stop the server
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000 