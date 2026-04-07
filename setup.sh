#!/bin/bash
# Sultan Mart - One-time setup script
set -e

echo "=============================="
echo "  Sultan Mart Setup"
echo "=============================="

# Backend setup
echo ""
echo "[1/5] Setting up Python environment..."
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

echo "[2/5] Installing Python dependencies..."
pip install -r requirements.txt

echo "[3/5] Configuring environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  .env created from .env.example — edit it with your settings"
fi

echo "[4/5] Running database migrations..."
python manage.py migrate

echo "[5/5] Seeding initial data..."
python manage.py seed_data

echo ""
echo "=============================="
echo "  Backend ready!"
echo "  Run: python manage.py runserver"
echo "=============================="

# Frontend setup
cd ../frontend
echo ""
echo "[Frontend] Installing Node dependencies..."
npm install
echo "  Run: npm run dev"
echo ""
echo "=============================="
echo "  Sultan Mart is ready!"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Admin:    http://localhost:8000/admin"
echo "  API Docs: http://localhost:8000/api/docs/"
echo "=============================="
