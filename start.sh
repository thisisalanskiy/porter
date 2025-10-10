#!/bin/bash

echo "Starting Reporter MVP..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version

echo
echo "Installing dependencies..."

# Install root dependencies
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

# Install server dependencies
cd server
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install server dependencies",
    exit 1
fi

# Install client dependencies
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install client dependencies"
    exit 1
fi

cd ..

echo
echo "Dependencies installed successfully!"
echo
echo "IMPORTANT: Make sure you have PostgreSQL running and configured."
echo "Edit server/.env with your database credentials before starting."
echo
echo "Starting development servers..."
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo

# Start the development servers
npm run dev

