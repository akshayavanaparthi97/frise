#!/bin/bash
# Frise Setup Script

echo "=========================================="
echo "  Frise - Smart Food Shelf-Life Tracker"
echo "=========================================="
echo ""

# Backend Setup
echo "Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Backend setup complete!"
echo "To start the backend server, run:"
echo "  cd backend"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "  venv\Scripts\activate"
else
    echo "  source venv/bin/activate"
fi
echo "  python main.py"
echo ""

# Frontend Setup
cd ../frontend

echo "Setting up Frontend..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "Frontend setup complete!"
echo "To start the frontend development server, run:"
echo "  cd frontend"
echo "  npm run dev"
echo ""

echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. In one terminal: cd backend && python main.py"
echo "2. In another terminal: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
