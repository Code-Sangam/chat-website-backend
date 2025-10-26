# Technology Stack & Build System

## Frontend Stack
- **React.js** with functional components and hooks
- **Socket.io-client** for WebSocket connections
- **React Router** for navigation
- **Axios** for HTTP requests
- **CSS Modules** or **Styled Components** for styling

## Backend Stack
- **Node.js** with **Express.js** framework
- **Socket.io** for WebSocket server
- **JWT** for authentication tokens
- **bcrypt** for password hashing
- **MongoDB** or **PostgreSQL** for data persistence
- **Redis** for session storage and message queuing

## Development Environment
- **Docker** containers for consistent environment
- Local development with hot reloading
- Environment-specific configuration files
- Local database instances

## Common Commands

### Development
```bash
# Frontend development server
npm run dev

# Backend development server
npm run dev

# Run both frontend and backend concurrently
npm run dev:all
```

### Testing
```bash
# Run frontend tests
npm test

# Run backend tests
npm run test:backend

# Run all tests
npm run test:all

# Run tests in watch mode
npm run test:watch
```

### Building
```bash
# Build frontend for production
npm run build

# Build backend for production
npm run build:backend
```

### Database
```bash
# Run database migrations
npm run migrate

# Seed test data
npm run seed

# Reset database
npm run db:reset
```

## Key Dependencies

### Frontend
- `react`, `react-dom`, `react-router-dom`
- `socket.io-client`, `axios`
- `@testing-library/react`, `jest`

### Backend
- `express`, `socket.io`, `jsonwebtoken`
- `bcrypt`, `mongoose` or `pg`
- `redis`, `express-validator`
- `jest`, `supertest`

## Security Requirements
- All passwords must be hashed with bcrypt (minimum 10 salt rounds)
- JWT tokens with appropriate expiration times
- Input validation and sanitization on all endpoints
- Rate limiting to prevent abuse
- CORS configuration for allowed origins