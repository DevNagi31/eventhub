# EventHub 🎯

A full-stack event discovery platform for finding sports and esports events near you, built with React, Node.js, PostgreSQL, Faktory job queue, and real-time chat.

![Home Page](screenshots/signup.png)

## 🚀 Features

- **Event Discovery**: Find sports and esports events within customizable radius
- **Automated Scraping**: Faktory job queue scrapes events from multiple sources every 4 hours
- **Group Communities**: Create and join groups based on interests
- **Real-time Chat**: Live group messaging with Socket.io and persistent message history
- **AI Assistant (HELP)**: Get personalized event recommendations
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Clean macOS-inspired UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS (custom macOS theme)
- Socket.io-client for real-time features
- React Router for navigation
- Axios for API calls

### Backend
- Node.js + Express
- PostgreSQL with geospatial queries (Haversine distance)
- Socket.io for WebSocket connections
- JWT authentication
- Redis for caching
- **Faktory** - Enterprise-grade job queue for automated scraping
- Cheerio for web scraping

### Architecture
- RESTful API design
- **Faktory job queue** for scheduled tasks (scrapes every 4 hours)
- WebSocket for real-time group chat
- Persistent message storage
- Job monitoring via Faktory Web UI

## 📸 Screenshots

### Event Discovery
![Events](screenshots/events.png)

### Event Discovery - Dark Mode
![Events Dark Mode](screenshots/eventsdarkmode.png)

### Groups
![Groups](screenshots/groups.png)

### Real-time Chat
![Chat](screenshots/group%20chat.png)

### AI Assistant (HELP)
![AI Bot](screenshots/aibot.png)

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis
- **Faktory** (job queue server)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/DevNagi31/eventhub.git
cd eventhub
```

2. **Install Faktory**
```bash
# macOS
brew install faktory
faktory

# Or download from: https://github.com/contribsys/faktory
```

3. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

4. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

5. **Setup Database**
```bash
psql -U postgres
CREATE DATABASE eventhub;
\c eventhub
# Run migrations from backend/migrations/
```

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/eventhub
REDIS_URL=redis://localhost:6379
FAKTORY_URL=tcp://localhost:7419
JWT_SECRET=your_secret_key_min_32_characters
ANTHROPIC_API_KEY=your_api_key (optional)
FRONTEND_URL=http://localhost:5173
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events/search` - Search events by location/radius/category
- `POST /api/events/refresh` - Trigger manual event scraping

### Groups
- `GET /api/groups/search` - Search groups
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/join` - Join group

### Chat
- `GET /api/group-messages/:groupId` - Get message history
- WebSocket events: `join-group`, `leave-group`, `group-message`

## 🎨 Key Features Explained

### Faktory Job Queue
- Enterprise-grade background job processing
- Automatic retry logic for failed scrapes
- Job monitoring via Web UI at http://localhost:7420
- Persistent job storage with Redis backend
- Scheduled scraping every 4 hours

### Automated Event Scraping
- Faktory worker processes scraping jobs
- Scrapes from: Eventbrite, university calendars, local leagues, esports tournaments
- Stores ~10 events per scrape with geospatial data
- Job failures tracked and retried automatically

### Real-time Group Chat
- Socket.io for instant message delivery
- Persistent message storage in PostgreSQL
- Message history loaded on group join

### Geospatial Queries
- Haversine formula for distance calculations
- Events searchable within custom radius (1-200 miles)
- Efficient PostgreSQL queries with distance filtering

## 🔍 Faktory Monitoring

Access the Faktory Web UI at `http://localhost:7420` to monitor:
- Job queue status
- Success/failure rates
- Job history
- Worker performance

## 🤝 Contributing

This is a portfolio project, but feedback is welcome!

## 👨‍💻 Author

**Dev Krishna Nagi**
- LinkedIn: [linkedin.com/in/dev-nagi31](https://linkedin.com/in/dev-nagi31)
- Portfolio: [portfolio-sandy-pi-24.vercel.app](https://portfolio-sandy-pi-24.vercel.app)
- Email: dnagi@binghamton.edu

## 📝 License

MIT License - feel free to use this for learning!

---

Built as part of Computer Science coursework at Binghamton University
