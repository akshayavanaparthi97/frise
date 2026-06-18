# Frise Project Structure

## Overview
```
frise/
├── backend/                    # FastAPI Backend
│   ├── main.py                # FastAPI application entry point
│   ├── models.py              # SQLAlchemy database models
│   ├── schemas.py             # Pydantic validation schemas
│   ├── database.py            # Database configuration and setup
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment variables template
│   ├── .gitignore            # Git ignore patterns
│   └── uploads/              # Uploaded food images storage
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── FoodCard.jsx                    # Food item card display
│   │   │   ├── FoodModal.jsx                   # Add/Edit food item modal
│   │   │   ├── Dashboard.jsx                   # Dashboard with stats
│   │   │   ├── Inventory.jsx                   # Inventory list view
│   │   │   ├── Analytics.jsx                   # Charts and analytics
│   │   │   ├── NotificationCenter.jsx          # Notification management
│   │   │   ├── FilterBar.jsx                   # Search and filter controls
│   │   │   └── Navbar.jsx                      # Navigation bar
│   │   │
│   │   ├── pages/             # Page components (for future routing)
│   │   │
│   │   ├── services/          # API and service layer
│   │   │   └── api.js                         # Axios API client
│   │   │
│   │   ├── styles/            # CSS stylesheets
│   │   │   ├── App.css                        # Main app styles
│   │   │   ├── index.css                      # Global styles
│   │   │   ├── Navbar.css                     # Navigation styles
│   │   │   ├── Dashboard.css                  # Dashboard styles
│   │   │   ├── FoodCard.css                   # Food card styles
│   │   │   ├── FoodModal.css                  # Modal styles
│   │   │   ├── Inventory.css                  # Inventory styles
│   │   │   ├── FilterBar.css                  # Filter bar styles
│   │   │   ├── NotificationCenter.css         # Notification styles
│   │   │   ├── Analytics.css                  # Analytics styles
│   │   │
│   │   ├── assets/            # Static assets (images, icons, etc.)
│   │   │
│   │   ├── App.jsx            # Main App component with routing
│   │   └── index.jsx          # React entry point
│   │
│   ├── index.html             # HTML entry point
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # NPM dependencies and scripts
│   ├── .env                   # Environment variables
│   ├── .env.example          # Environment variables template
│   ├── .gitignore            # Git ignore patterns
│   └── node_modules/         # Installed npm packages (git ignored)
│
├── .github/
│   └── copilot-instructions.md   # Project instructions for Copilot
│
├── README.md                  # Project documentation
├── QUICKSTART.md             # Quick start guide
├── PROJECT_STRUCTURE.md      # This file
├── setup.sh                  # Setup script for macOS/Linux
├── setup.bat                 # Setup script for Windows
└── .gitignore               # Root git ignore patterns
```

## Component Hierarchy

```
App
├── Navbar
├── Routes
│   ├── Dashboard
│   │   └── DashboardCards (4x)
│   ├── Inventory
│   │   ├── FilterBar
│   │   ├── FoodCard (Grid)
│   │   └── FAB (+button)
│   ├── Notifications
│   │   └── NotificationCenter
│   └── Analytics
│       ├── Charts
│       └── Statistics
└── FoodModal (Portal)
    └── FormInputs
```

## Database Schema

### FoodItem Table
```sql
id              INTEGER PRIMARY KEY
item_name       VARCHAR(255) NOT NULL
category        VARCHAR(100) NOT NULL
barcode         VARCHAR(100) UNIQUE
image_path      VARCHAR(500)
expiry_date     DATETIME NOT NULL
created_at      DATETIME DEFAULT now()
status          ENUM('fresh', 'expiring_soon', 'expired')
quantity        INTEGER DEFAULT 1
description     VARCHAR(500)
unit            VARCHAR(50)
```

### Notification Table
```sql
id                  INTEGER PRIMARY KEY
item_id             INTEGER NOT NULL (FK)
message             VARCHAR(500) NOT NULL
notification_type   ENUM('expiring_soon', 'expired', 'info')
created_at          DATETIME DEFAULT now()
is_read             BOOLEAN DEFAULT FALSE
triggered_at        DATETIME
```

### ActivityLog Table
```sql
id          INTEGER PRIMARY KEY
action      VARCHAR(100) NOT NULL
item_id     INTEGER
details     VARCHAR(500)
created_at  DATETIME DEFAULT now()
```

## API Endpoints

### Food Items Management
- `POST /api/food-items` - Create new food item
- `GET /api/food-items` - List all items (with filters, sorting)
- `GET /api/food-items/{id}` - Get specific item
- `PUT /api/food-items/{id}` - Update item
- `DELETE /api/food-items/{id}` - Delete item
- `POST /api/food-items/{id}/upload-image` - Upload food image

### Search & Filter
- `GET /api/search?query=term` - Search by name or barcode

### Dashboard Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/categories` - Get category-wise statistics

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications?unread_only=true` - Get unread only
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

### Health Check
- `GET /health` - Health check endpoint

## File Organization

### Backend Files
- **main.py**: FastAPI application with all endpoints
- **models.py**: SQLAlchemy ORM models
- **schemas.py**: Pydantic validation schemas
- **database.py**: Database connection and setup

### Frontend Files
- **App.jsx**: Main component with routing logic
- **components/*.jsx**: Reusable components for UI
- **services/api.js**: Centralized API client
- **styles/*.css**: Component-specific styling

## Key Features by Component

### Navbar
- Navigation between Dashboard, Inventory, Notifications, Analytics
- Badge showing unread notification count
- Responsive mobile design

### Dashboard
- Statistics cards (Total, Fresh, Expiring, Expired)
- Alert system for critical items
- Real-time status updates

### Inventory
- Grid view of food items with card layout
- Search by name or barcode
- Filter by category and status
- Sort by various criteria
- Add/Edit/Delete operations
- Image upload per item

### FoodModal
- Form for creating/editing food items
- Input validation
- Success/error handling
- Cancel/Submit actions

### Notifications
- Chronological list of notifications
- Filter by type (all, unread, expiring, expired)
- Mark as read functionality
- Delete notifications

### Analytics
- Category distribution pie chart
- Status overview bar chart
- Monthly waste trend line chart
- Statistics summary cards

## Development Workflow

1. **Start Backend**: `cd backend && python main.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Make Changes**: Edit components/styles
4. **Test**: Use browser DevTools and API docs at `/docs`
5. **Build**: `npm run build` for production

## Deployment

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### Frontend
```bash
npm run build
# Deploy dist/ folder to CDN/hosting
```

## Environment Configuration

### Backend (.env)
```
DATABASE_URL=sqlite:///./frise.db
DEBUG=False
API_TITLE=Frise API
API_VERSION=1.0.0
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```

## Dependencies

### Backend
- FastAPI: Web framework
- SQLAlchemy: ORM
- Pydantic: Data validation
- Uvicorn: ASGI server
- Pillow: Image processing

### Frontend
- React: UI framework
- React Router: Client-side routing
- Axios: HTTP client
- Recharts: Charts library
- React Icons: Icon library
- React Toastify: Notifications

## Performance Considerations

1. **Database**: SQLite for dev, consider PostgreSQL for production
2. **Caching**: Frontend caches API responses with 30s refresh
3. **Image Optimization**: Pillow for image processing
4. **Lazy Loading**: Consider for large inventory lists
5. **API Pagination**: Implemented with skip/limit parameters

## Security Considerations

1. **Input Validation**: Pydantic schemas on backend
2. **File Upload**: Type validation and size limits
3. **CORS**: Configured for localhost development
4. **SQL Injection**: SQLAlchemy prevents SQL injection
5. **XSS Protection**: React auto-escapes content

## Future Enhancements

- [ ] WebSocket real-time updates
- [ ] User authentication
- [ ] Dark mode theme
- [ ] Email notifications
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Recipe suggestions
- [ ] Multi-user support
- [ ] Cloud sync
- [ ] Offline support
