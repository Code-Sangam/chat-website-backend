# Chat Website API Documentation

## Overview

This document provides comprehensive documentation for the Chat Website API, including REST endpoints and WebSocket events. The API is designed to support both web and mobile applications with real-time messaging capabilities.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Additional error context (optional)
  }
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **Message sending**: 30 messages per minute per user
- **User search**: 10 requests per minute per user
- **General API**: 100 requests per minute per user

## REST API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "uniqueUserId": "A1B2C3D4",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2023-10-26T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `409 Conflict` - User already exists
- `400 Bad Request` - Validation errors

#### Sign In User
```http
POST /api/auth/signin
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "uniqueUserId": "A1B2C3D4",
      "username": "johndoe",
      "email": "john@example.com",
      "isOnline": true,
      "lastActive": "2023-10-26T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

#### Sign Out User
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Verify Token
```http
GET /api/auth/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "uniqueUserId": "A1B2C3D4",
      "username": "johndoe",
      "email": "john@example.com",
      "isOnline": true,
      "lastActive": "2023-10-26T10:30:00.000Z"
    }
  }
}
```

### User Management

#### Search Users
```http
GET /api/users/search/:userId
```

**Parameters:**
- `userId` (string): Unique user ID to search for (max 8 characters, alphanumeric)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User found",
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439012",
        "uniqueUserId": "B2C3D4E5",
        "username": "janedoe",
        "isOnline": false,
        "lastActive": "2023-10-26T09:15:00.000Z"
      }
    ],
    "searchTerm": "B2C3D4E5",
    "resultCount": 1
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid search term
- `404 Not Found` - User not found

#### Get User Profile
```http
GET /api/users/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "uniqueUserId": "A1B2C3D4",
      "username": "johndoe",
      "email": "john@example.com",
      "isOnline": true,
      "lastActive": "2023-10-26T10:30:00.000Z",
      "createdAt": "2023-10-20T08:00:00.000Z"
    }
  }
}
```

#### Update User Profile
```http
PUT /api/users/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "johnsmith"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "uniqueUserId": "A1B2C3D4",
      "username": "johnsmith",
      "email": "john@example.com",
      "isOnline": true,
      "lastActive": "2023-10-26T10:30:00.000Z",
      "updatedAt": "2023-10-26T10:35:00.000Z"
    }
  }
}
```

### Chat Management

#### Get User Chats
```http
GET /api/chats?limit=20&skip=0
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (integer, optional): Number of chats to return (default: 20, max: 100)
- `skip` (integer, optional): Number of chats to skip (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "507f1f77bcf86cd799439013",
        "participants": [
          {
            "id": "507f1f77bcf86cd799439011",
            "uniqueUserId": "A1B2C3D4",
            "username": "johndoe",
            "isOnline": true,
            "lastActive": "2023-10-26T10:30:00.000Z"
          },
          {
            "id": "507f1f77bcf86cd799439012",
            "uniqueUserId": "B2C3D4E5",
            "username": "janedoe",
            "isOnline": false,
            "lastActive": "2023-10-26T09:15:00.000Z"
          }
        ],
        "lastMessage": {
          "content": "Hello there!",
          "sender": "507f1f77bcf86cd799439012",
          "timestamp": "2023-10-26T10:25:00.000Z"
        },
        "unreadCount": 2,
        "createdAt": "2023-10-26T08:00:00.000Z"
      }
    ],
    "count": 1,
    "hasMore": false
  }
}
```

#### Get or Create Chat
```http
GET /api/chats/with/:otherUserId
```

**Parameters:**
- `otherUserId` (string): MongoDB ObjectId of the other user

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "507f1f77bcf86cd799439013",
      "participants": [
        {
          "id": "507f1f77bcf86cd799439011",
          "uniqueUserId": "A1B2C3D4",
          "username": "johndoe",
          "isOnline": true,
          "lastActive": "2023-10-26T10:30:00.000Z"
        },
        {
          "id": "507f1f77bcf86cd799439012",
          "uniqueUserId": "B2C3D4E5",
          "username": "janedoe",
          "isOnline": false,
          "lastActive": "2023-10-26T09:15:00.000Z"
        }
      ],
      "unreadCount": 0,
      "createdAt": "2023-10-26T08:00:00.000Z"
    }
  }
}
```

#### Get Chat Messages
```http
GET /api/chats/:chatId/messages?limit=50&skip=0
```

**Parameters:**
- `chatId` (string): MongoDB ObjectId of the chat

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (integer, optional): Number of messages to return (default: 50, max: 100)
- `skip` (integer, optional): Number of messages to skip (default: 0)
- `after` (string, optional): ISO timestamp to get messages after

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "507f1f77bcf86cd799439014",
        "chatId": "507f1f77bcf86cd799439013",
        "sender": {
          "id": "507f1f77bcf86cd799439012",
          "uniqueUserId": "B2C3D4E5",
          "username": "janedoe"
        },
        "content": "Hello there!",
        "messageType": "text",
        "timestamp": "2023-10-26T10:25:00.000Z",
        "isRead": false,
        "isEdited": false
      }
    ],
    "count": 1,
    "hasMore": false
  }
}
```

#### Send Message
```http
POST /api/chats/:chatId/messages
```

**Parameters:**
- `chatId` (string): MongoDB ObjectId of the chat

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Hello! How are you?",
  "messageType": "text",
  "replyToId": "507f1f77bcf86cd799439014"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "507f1f77bcf86cd799439015",
      "chatId": "507f1f77bcf86cd799439013",
      "sender": {
        "id": "507f1f77bcf86cd799439011",
        "uniqueUserId": "A1B2C3D4",
        "username": "johndoe"
      },
      "content": "Hello! How are you?",
      "messageType": "text",
      "timestamp": "2023-10-26T10:30:00.000Z",
      "replyTo": {
        "id": "507f1f77bcf86cd799439014",
        "content": "Hello there!",
        "sender": "janedoe"
      }
    }
  }
}
```

#### Mark Messages as Read
```http
PUT /api/chats/:chatId/read
```

**Parameters:**
- `chatId` (string): MongoDB ObjectId of the chat

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "messageIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

## WebSocket Events

### Connection

Connect to WebSocket server at `/` with authentication:

```javascript
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client Events (Emit)

#### Join Chat
```javascript
socket.emit('join_chat', {
  chatId: '507f1f77bcf86cd799439013'
});
```

#### Leave Chat
```javascript
socket.emit('leave_chat', {
  chatId: '507f1f77bcf86cd799439013'
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  chatId: '507f1f77bcf86cd799439013',
  content: 'Hello from WebSocket!',
  messageType: 'text',
  replyToId: '507f1f77bcf86cd799439014' // optional
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  chatId: '507f1f77bcf86cd799439013'
});

// Stop typing
socket.emit('typing_stop', {
  chatId: '507f1f77bcf86cd799439013'
});
```

#### Mark Messages as Read
```javascript
socket.emit('mark_messages_read', {
  chatId: '507f1f77bcf86cd799439013',
  messageIds: ['507f1f77bcf86cd799439014']
});
```

#### Get User Status
```javascript
socket.emit('get_user_status', {
  userIds: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439016']
});
```

### Server Events (Listen)

#### Connection Events
```javascript
// Connection successful
socket.on('connect', () => {
  console.log('Connected to server');
});

// Chat joined successfully
socket.on('chat_joined', (data) => {
  console.log('Joined chat:', data.chatId);
});

// Chat left successfully
socket.on('chat_left', (data) => {
  console.log('Left chat:', data.chatId);
});
```

#### Message Events
```javascript
// New message received
socket.on('new_message', (data) => {
  console.log('New message:', data);
  /*
  {
    message: {
      id: '507f1f77bcf86cd799439015',
      chatId: '507f1f77bcf86cd799439013',
      sender: {
        id: '507f1f77bcf86cd799439012',
        username: 'janedoe'
      },
      content: 'Hello!',
      timestamp: '2023-10-26T10:30:00.000Z'
    }
  }
  */
});

// Message sent confirmation
socket.on('message_sent', (data) => {
  console.log('Message sent:', data);
  /*
  {
    messageId: '507f1f77bcf86cd799439015',
    chatId: '507f1f77bcf86cd799439013',
    timestamp: '2023-10-26T10:30:00.000Z'
  }
  */
});

// Message edited
socket.on('message_edited', (data) => {
  console.log('Message edited:', data);
});

// Message deleted
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data);
});
```

#### Typing Events
```javascript
// User started typing
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  /*
  {
    userId: '507f1f77bcf86cd799439012',
    username: 'janedoe',
    chatId: '507f1f77bcf86cd799439013'
  }
  */
});

// User stopped typing
socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data);
});
```

#### Status Events
```javascript
// User online/offline status changed
socket.on('user_status_changed', (data) => {
  console.log('User status changed:', data);
  /*
  {
    userId: '507f1f77bcf86cd799439012',
    isOnline: true,
    timestamp: '2023-10-26T10:30:00.000Z'
  }
  */
});

// User statuses response
socket.on('user_statuses', (data) => {
  console.log('User statuses:', data);
  /*
  {
    '507f1f77bcf86cd799439012': {
      isOnline: true,
      lastActive: '2023-10-26T10:30:00.000Z'
    }
  }
  */
});

// Messages marked as read
socket.on('messages_read', (data) => {
  console.log('Messages read:', data);
  /*
  {
    chatId: '507f1f77bcf86cd799439013',
    readBy: '507f1f77bcf86cd799439012',
    messageIds: ['507f1f77bcf86cd799439014']
  }
  */
});
```

#### Error Events
```javascript
// General error
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});

// Disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Mobile App Integration Examples

### React Native Example

```javascript
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.baseURL = 'https://your-api-domain.com/api';
  }

  // Initialize connection
  connect(token) {
    this.socket = io('wss://your-api-domain.com', {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
  }

  // API calls
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Store token and connect to WebSocket
      await AsyncStorage.setItem('authToken', data.data.token);
      this.connect(data.data.token);
    }

    return data;
  }

  async searchUsers(userId) {
    const token = await AsyncStorage.getItem('authToken');
    
    const response = await fetch(`${this.baseURL}/users/search/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }

  // WebSocket methods
  joinChat(chatId) {
    this.socket?.emit('join_chat', { chatId });
  }

  sendMessage(chatId, content) {
    this.socket?.emit('send_message', { chatId, content });
  }

  setupEventListeners() {
    this.socket?.on('new_message', (data) => {
      // Handle new message in your app
      this.onNewMessage(data.message);
    });

    this.socket?.on('user_typing', (data) => {
      // Show typing indicator
      this.onUserTyping(data);
    });
  }
}
```

### Flutter Example

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;

class ChatService {
  IO.Socket? socket;
  final String baseUrl = 'https://your-api-domain.com/api';
  
  // Connect to WebSocket
  void connect(String token) {
    socket = IO.io('wss://your-api-domain.com', 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .build()
    );

    socket?.on('new_message', (data) {
      // Handle new message
      handleNewMessage(data);
    });

    socket?.connect();
  }

  // API call example
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signin'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    
    if (data['success']) {
      // Store token and connect
      await storage.write(key: 'authToken', value: data['data']['token']);
      connect(data['data']['token']);
    }

    return data;
  }

  // Send message via WebSocket
  void sendMessage(String chatId, String content) {
    socket?.emit('send_message', {
      'chatId': chatId,
      'content': content,
    });
  }
}
```

## Error Codes Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `USER_EXISTS` | User already exists | 409 |
| `INVALID_CREDENTIALS` | Invalid login credentials | 401 |
| `USER_NOT_FOUND` | User not found | 404 |
| `UNAUTHORIZED` | Access denied | 403 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `INVALID_INPUT` | Invalid request data | 400 |
| `CHAT_NOT_FOUND` | Chat not found | 404 |
| `INTERNAL_ERROR` | Server error | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |

## Security Considerations

1. **Authentication**: All protected endpoints require valid JWT token
2. **Rate Limiting**: Implemented to prevent abuse
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS**: Configured for allowed origins only
5. **Password Security**: Passwords are hashed with bcrypt
6. **WebSocket Security**: Authentication required before connection

## Testing

Use tools like Postman, Insomnia, or curl to test the API endpoints. For WebSocket testing, use tools like Socket.io client or browser developer tools.

### Example curl commands:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Search users (with token)
curl -X GET http://localhost:5000/api/users/search/A1B2C3D4 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```