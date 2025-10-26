# Chat Website

A real-time messaging web application with user authentication, search functionality, and API support for mobile development.

## Features

- User registration and authentication
- Real-time messaging with WebSocket connections
- User search by unique ID
- RESTful API endpoints
- Secure session management

## Tech Stack

**Frontend:**
- React.js with Vite
- Socket.io-client for real-time communication
- React Router for navigation
- Axios for HTTP requests
- Styled Components for styling

**Backend:**
- Node.js with Express.js
- Socket.io for WebSocket server
- MongoDB with Mongoose
- JWT for authentication
- Redis for session storage
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis (optional, for production)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

4. Update the environment variables with your configuration

### Development

Start both frontend and backend servers:
```bash
npm run dev
```

Or start them separately:
```bash
# Frontend (http://localhost:3000)
npm run dev:frontend

# Backend (http://localhost:5000)
npm run dev:backend
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Documentation

The API endpoints will be documented as development progresses.

## Project Structure

```
/
├── frontend/           # React application
├── backend/           # Express.js API server
├── shared/            # Shared utilities (future)
├── docs/              # API documentation (future)
└── README.md          # This file
```

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation as needed

## License

MIT