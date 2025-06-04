# Street Meat Event Community Platform

A full-stack community platform for street meat events featuring real-time social feeds, user management, and location-based interactions.

## Features

### 🌟 Social Feed
- **Real-time posts and comments** with WebSocket support
- **Location-based filtering** for targeted discussions
- **Like and interaction system** for posts and comments
- **Nested comment threads** with reply functionality
- **Rich text content** with emoji support
- **Live updates** when other users post, comment, or like

### 👥 Community Management
- **User registration and profiles** with pickup locations
- **Admin controls** for content moderation
- **Live user roster** showing community members
- **Location-based user filtering**

### 🔄 Real-time Features
- **WebSocket connections** for instant updates
- **Connection status indicators**
- **Automatic reconnection** with exponential backoff
- **Offline mode support**

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful UI components
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Axios** for HTTP requests
- **WebSocket API** for real-time updates

### Backend
- **FastAPI 0.110** with Python
- **SQLAlchemy 2.0** for database ORM
- **PostgreSQL** for production database
- **WebSocket support** for real-time features
- **Pydantic** for data validation
- **CORS middleware** for cross-origin requests

## Project Structure

```
street-meat-gatherings-unite/
├── backend/                 # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── routes/             # API routes
│   │   ├── auth.py         # Authentication routes
│   │   ├── social_feed.py  # Social feed routes
│   │   └── websocket.py    # WebSocket routes
│   ├── requirements.txt    # Python dependencies
│   └── seed_data.py        # Database seeding script
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── PostCard.tsx    # Individual post display
│   │   ├── CommentCard.tsx # Comment display with nesting
│   │   ├── CreatePost.tsx  # Post creation form
│   │   ├── SocialFeed.tsx  # Main social feed component
│   │   └── UserCard.tsx    # User profile cards
│   ├── hooks/              # Custom React hooks
│   │   └── useWebSocket.ts # WebSocket management
│   ├── lib/                # Utility libraries
│   │   └── api.ts          # API service layer
│   ├── pages/              # Page components
│   │   └── Community.tsx   # Main community page
│   └── types/              # TypeScript type definitions
├── package.json            # Frontend dependencies
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 15+ (or SQLite for development)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database:**
   ```bash
   # For PostgreSQL (recommended for production)
   export DATABASE_URL="postgresql+psycopg://streetmeat:supersecret@localhost:5432/streetmeat"
   
   # For SQLite (development only)
   # Comment out the PostgreSQL URL in database.py and uncomment SQLite
   ```

5. **Seed the database:**
   ```bash
   python seed_data.py
   ```

6. **Start the backend server:**
   ```bash
   python main.py
   # Or use uvicorn directly:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file (optional)
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

3. **Start the development server:**
   ```bash
npm run dev
```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/users` - Get all users
- `GET /api/auth/users/{id}` - Get specific user
- `PUT /api/auth/users/{id}` - Update user
- `DELETE /api/auth/users/{id}` - Delete user (admin only)
- `GET /api/auth/pickup-locations` - Get pickup locations
- `GET /api/auth/time-slots` - Get time slots

### Social Feed
- `GET /api/social/posts` - Get posts with filtering
- `POST /api/social/posts` - Create new post
- `GET /api/social/posts/{id}` - Get specific post
- `PUT /api/social/posts/{id}` - Update post
- `DELETE /api/social/posts/{id}` - Delete post
- `POST /api/social/posts/{id}/like` - Toggle post like
- `POST /api/social/posts/{id}/comments` - Create comment
- `GET /api/social/comments/{id}` - Get comment
- `PUT /api/social/comments/{id}` - Update comment
- `DELETE /api/social/comments/{id}` - Delete comment
- `POST /api/social/comments/{id}/like` - Toggle comment like

### WebSocket
- `WS /ws/{user_id}` - WebSocket connection for real-time updates
- `GET /ws/stats` - Get connection statistics

## Usage

### For Users
1. **Sign up** with your name, pickup location, and time slot
2. **Browse the community** to see other members
3. **Create posts** to share updates or ask questions
4. **Comment and like** posts to engage with the community
5. **Filter by location** to see relevant discussions
6. **Enjoy real-time updates** as others interact

### For Admins
1. **Moderate content** by editing or deleting inappropriate posts/comments
2. **Manage users** by removing problematic accounts
3. **Monitor activity** through the admin interface

## Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
npm test
```

### Building for Production
```bash
# Frontend build
npm run build

# Backend deployment
# Use a production WSGI server like Gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Database Migrations
```bash
# When you modify models.py, create migrations
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for the street meat community!
