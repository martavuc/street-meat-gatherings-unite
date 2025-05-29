#!/bin/bash

# Street Meat Event Backend Startup Script

echo "🌮 Starting Street Meat Event Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set default database URL if not set
if [ -z "$DATABASE_URL" ]; then
    echo "Setting default SQLite database URL..."
    export DATABASE_URL="sqlite:///./streetmeat.db"
fi

# Seed database
echo "Seeding database..."
python seed_data.py

# Start the server
echo "Starting FastAPI server on http://localhost:8000"
echo "API documentation available at http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000 