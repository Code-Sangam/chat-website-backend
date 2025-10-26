# Project Structure & Organization

## Root Directory Layout
```
/
├── frontend/           # React application
├── backend/           # Express.js API server
├── shared/            # Shared utilities and types
├── docs/              # API documentation
├── docker-compose.yml # Development environment
└── README.md          # Project documentation
```

## Frontend Structure (`/frontend`)
```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── auth/      # Authentication components
│   │   ├── chat/      # Chat-related components
│   │   └── common/    # Shared UI components
│   ├── pages/         # Route-level components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API calls and WebSocket logic
│   ├── utils/         # Helper functions
│   ├── styles/        # Global styles and themes
│   └── App.js         # Main application component
├── package.json
└── .env.example       # Environment variables template
```

## Backend Structure (`/backend`)
```
backend/
├── src/
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic
│   ├── utils/         # Helper functions
│   ├── config/        # Configuration files
│   └── app.js         # Express application setup
├── tests/             # Test files
├── package.json
└── .env.example       # Environment variables template
```

## Key Architectural Patterns

### Component Organization
- **Authentication Components**: `SignupForm`, `SigninForm`, `AuthGuard`
- **Chat Components**: `ChatLayout`, `UserSearch`, `ChatWindow`, `MessageList`, `MessageInput`
- **Utility Components**: `ProtectedRoute`, `LoadingSpinner`, `ErrorBoundary`

### API Route Organization
- **Authentication**: `/api/auth/*` - signup, signin, logout, verify
- **Users**: `/api/users/*` - search, profile management
- **Chats**: `/api/chats/*` - chat history, message retrieval

### Database Models
- **User**: uniqueUserId, username, email, passwordHash, timestamps
- **Chat**: participants, lastMessage, createdAt
- **Message**: chatId, sender, content, timestamp, messageType
- **Session**: userId, token, expiration, isActive

### WebSocket Events
- `connection`, `join_chat`, `send_message`, `receive_message`
- `user_typing`, `disconnect`

## Naming Conventions

### Files and Directories
- Use **kebab-case** for file names: `user-search.js`
- Use **PascalCase** for React components: `UserSearch.jsx`
- Use **camelCase** for JavaScript functions and variables

### API Endpoints
- Use **RESTful** conventions: `GET /api/users/:id`
- Use **plural nouns** for resources: `/api/users`, `/api/chats`
- Use **kebab-case** for multi-word endpoints: `/api/chat-history`

### Database Fields
- Use **camelCase** for field names: `uniqueUserId`, `createdAt`
- Use descriptive names: `passwordHash` not `pwd`
- Include timestamps: `createdAt`, `updatedAt`

## Code Organization Principles

### Separation of Concerns
- Keep business logic in services, not controllers
- Separate API routes from WebSocket event handlers
- Isolate database operations in model methods

### Error Handling
- Centralized error middleware for Express routes
- Structured error responses with consistent format
- Global error boundary for React components

### Testing Structure
- Unit tests alongside source files: `user.service.test.js`
- Integration tests in dedicated test directories
- End-to-end tests for critical user flows