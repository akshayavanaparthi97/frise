@echo off
REM Frise Setup Script for Windows

echo.
echo ==========================================
echo   Frise - Smart Food Shelf-Life Tracker
echo ==========================================
echo.

REM Backend Setup
echo Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Backend setup complete!
echo.
echo To start the backend server, run:
echo   cd backend
echo   venv\Scripts\activate.bat
echo   python main.py
echo.

REM Frontend Setup
cd ..\frontend

echo Setting up Frontend...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo.
echo Frontend setup complete!
echo.
echo To start the frontend development server, run:
echo   cd frontend
echo   npm run dev
echo.

echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. In one terminal: cd backend ^&^& python main.py
echo 2. In another terminal: cd frontend ^&^& npm run dev
echo 3. Open http://localhost:3000 in your browser
echo.

pause
