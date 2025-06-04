#!/bin/bash

echo "🌮 Starting Street Meat Event Backend..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set default port if not set by Render
if [ -z "$PORT" ]; then
    export PORT=8000
fi

# Start the server
echo "Starting FastAPI server on port $PORT"
cd ..
PYTHONPATH=$PYTHONPATH:. uvicorn backend.main:app --host 0.0.0.0 --port $PORT 