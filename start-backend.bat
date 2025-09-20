@echo off
echo Starting Dentist Backend Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found
    echo Please run this script from the backend directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if config.env exists
if not exist config.env (
    echo WARNING: config.env not found
    echo Please create config.env with your MongoDB URI and other settings
    echo.
)

REM Start the server
echo Starting server...
echo.
echo Backend will be available at: http://localhost:5000
echo API Documentation: http://localhost:5000/api-docs
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
