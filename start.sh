#!/bin/bash

# Change to the application directory
cd "$(dirname "$0")/" || exit

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org/ to run this application."
    exit 1
fi

echo "Checking dependencies..."
# Install dependencies if node_modules is missing or package.json has changed
if [ ! -d "node_modules" ]; then
    echo "Installing required dependencies..."
    npm install --no-fund --no-audit
fi

echo "Starting application..."
# Start the application (Vite will automatically open the browser because of the --open flag)
npm start
