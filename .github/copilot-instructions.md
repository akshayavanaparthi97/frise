# Frise - Smart Food Shelf-Life Tracker

## Project Overview
A full-stack web application for food inventory management with real-time expiry tracking, notifications, barcode scanning, and analytics.

## Technology Stack
- **Frontend**: React.js, Axios, CSS3, Recharts
- **Backend**: FastAPI (Python)
- **Database**: SQLite (development)
- **ORM**: SQLAlchemy
- **Real-Time**: WebSockets
- **Features**: Barcode scanning, image uploads, analytics

## Setup Progress

- [x] Project structure created
- [ ] Backend FastAPI setup
- [ ] Frontend React setup
- [ ] Database models configured
- [ ] API endpoints developed
- [ ] React components built
- [ ] WebSocket implementation
- [ ] Real-time notifications
- [ ] Barcode scanning
- [ ] Image upload system
- [ ] Analytics dashboard
- [ ] Testing & documentation

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Key Files
- `backend/main.py` - FastAPI application
- `backend/models.py` - Database models
- `backend/schemas.py` - Pydantic schemas
- `backend/database.py` - Database configuration
- `frontend/src/App.js` - React main app
- `frontend/src/components/` - React components

## Running the Application
1. Start backend: `python main.py` (runs on http://localhost:8000)
2. Start frontend: `npm start` (runs on http://localhost:3000)
3. Access at http://localhost:3000
