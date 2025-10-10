@echo off
cd /d "%~dp0"
echo Starting Reporter MVP...
echo Current directory: %CD%
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

cd ../client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo IMPORTANT: Make sure you have PostgreSQL running and configured.
echo Edit server/.env with your database credentials before starting.
echo.
echo Starting development servers...
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.

cd ..
start /B cmd /k "npm run dev"

echo Development servers are starting...
echo Check the terminal windows for any errors.
echo Once started, open http://localhost:3000 in your browser
echo.
pause

