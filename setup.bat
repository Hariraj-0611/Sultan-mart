@echo off
echo ==============================
echo   Sultan Mart Setup (Windows)
echo ==============================

cd backend
echo [1/5] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate

echo [2/5] Installing dependencies...
pip install -r requirements.txt

echo [3/5] Configuring environment...
if not exist .env (
  copy .env.example .env
  echo   .env created - edit it with your DB settings
)

echo [4/5] Running migrations...
python manage.py migrate

echo [5/5] Seeding data...
python manage.py seed_data

echo.
echo Backend ready! Run: python manage.py runserver

cd ..\frontend
echo.
echo [Frontend] Installing Node packages...
npm install
echo Run: npm run dev

echo.
echo ==============================
echo   Sultan Mart is ready!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Admin:    http://localhost:8000/admin
echo   API Docs: http://localhost:8000/api/docs/
echo ==============================
pause
