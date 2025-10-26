# Mobile App Integration Guide

## Overview

This guide provides detailed examples and best practices for integrating the Chat Website API into mobile applications. It covers authentication flows, real-time messaging, and platform-specific implementations.

## Authentication Flow

### 1. User Registration and Login

```javascript
// React Native Example
class AuthService {
  constructor() {
    this.baseURL = 'https://your-api-domain.com/api';
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
      if (result.success) {
        // Store user data and token
        await AsyncStorage.setItem('authToken', result.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data.user));
        return { success: true, user: result.data.user };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (result.success) {
        await AsyncStorage.setItem('authToken', result.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data.user));
        return { success: true, user: result.data.user, token: result.data.token };
      } else {
        return { success: false, error: result.error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async logout() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Clear local storage
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  }

  async getStoredToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async getStoredUser() {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}
```

### 2. Flutter Authentication Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  final String baseUrl = 'https://your-api-domain.com/api';
  
  Future<Map<String, dynamic>> register(Map<String, String> userData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(userData),
      );

      final result = jsonDecode(response.body);
      
      if (result['success']) {
        // Store token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('authToken', result['data']['token']);
        await prefs.setString('userData', jsonEncode(result['data']['user']));
        
        return {'success': true, 'user': result['data']['user']};
      } else {
        return {'success': false, 'error': result['error']['message']};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signin'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final result = jsonDecode(response.body);
      
      if (result['success']) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('authToken', result['data']['token']);
        await prefs.setString('userData', jsonEncode(result['data']['user']));
        
        return {
          'success': true, 
          'user': result['data']['user'],
          'token': result['data']['token']
        };
      } else {
        return {'success': false, 'error': result['error']['message']};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  Future<String?> getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('authToken');
  }

  Future<Map<String, dynamic>?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString('userData');
    return userData != null ? jsonDecode(userData) : null;
  }
}
```

## Real-Time Messaging Implementation

### 1. React Native WebSocket Service

```javascript
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.baseURL = 'https://your-api-domain.com/api';
    this.wsURL = 'wss://your-api-domain.com';
    this.messageListeners = [];
    this.statusListeners = [];
    this.typingListeners = [];
  }

  // Initialize WebSocket connection
  async connect() {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    this.socket = io(this.wsURL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Connected to chat server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection failed:', error);
        reject(error);
      });
    });
  }

  setupEventListeners() {
    // Message events
    this.socket.on('new_message', (data) => {
      this.messageListeners.forEach(listener => listener(data.message));
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.typingListeners.forEach(listener => 
        listener({ ...data, isTyping: true })
      );
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.typingListeners.forEach(listener => 
        listener({ ...data, isTyping: false })
      );
    });

    // Status events
    this.socket.on('user_status_changed', (data) => {
      this.statusListeners.forEach(listener => listener(data));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });
  }

  // Chat operations
  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  sendMessage(chatId, content, messageType = 'text', replyToId = null) {
    if (this.socket) {
      this.socket.emit('send_message', {
        chatId,
        content,
        messageType,
        replyToId
      });
    }
  }

  startTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  stopTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  markMessagesAsRead(chatId, messageIds) {
    if (this.socket) {
      this.socket.emit('mark_messages_read', { chatId, messageIds });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    this.messageListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  onUserStatusChange(callback) {
    this.statusListeners.push(callback);
    
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  onTypingChange(callback) {
    this.typingListeners.push(callback);
    
    return () => {
      const index = this.typingListeners.indexOf(callback);
      if (index > -1) {
        this.typingListeners.splice(index, 1);
      }
    };
  }

  // REST API methods
  async searchUsers(userId) {
    const token = await AsyncStorage.getItem('authToken');
    
    try {
      const response = await fetch(`${this.baseURL}/users/search/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getUserChats(limit = 20, skip = 0) {
    const token = await AsyncStorage.getItem('authToken');
    
    try {
      const response = await fetch(
        `${this.baseURL}/chats?limit=${limit}&skip=${skip}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getChatMessages(chatId, limit = 50, skip = 0) {
    const token = await AsyncStorage.getItem('authToken');
    
    try {
      const response = await fetch(
        `${this.baseURL}/chats/${chatId}/messages?limit=${limit}&skip=${skip}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async getOrCreateChat(otherUserId) {
    const token = await AsyncStorage.getItem('authToken');
    
    try {
      const response = await fetch(
        `${this.baseURL}/chats/with/${otherUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear listeners
    this.messageListeners = [];
    this.statusListeners = [];
    this.typingListeners = [];
  }
}

// Usage in React Native component
export default function ChatScreen({ route }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatService = useRef(new ChatService()).current;

  useEffect(() => {
    // Initialize chat service
    const initializeChat = async () => {
      try {
        await chatService.connect();
        chatService.joinChat(chatId);
        
        // Load initial messages
        const result = await chatService.getChatMessages(chatId);
        if (result.success) {
          setMessages(result.data.messages.reverse());
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();

    // Set up message listener
    const unsubscribeMessages = chatService.onNewMessage((message) => {
      if (message.chatId === chatId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Set up typing listener
    const unsubscribeTyping = chatService.onTypingChange((data) => {
      if (data.chatId === chatId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      chatService.leaveChat(chatId);
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      chatService.sendMessage(chatId, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (text.length > 0 && !isTyping) {
      chatService.startTyping(chatId);
    } else if (text.length === 0 && isTyping) {
      chatService.stopTyping(chatId);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem message={item} />
        )}
      />
      
      {isTyping && (
        <Text style={styles.typingIndicator}>Someone is typing...</Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          style={styles.textInput}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### 2. Flutter WebSocket Service

```dart
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;

class ChatService {
  IO.Socket? socket;
  final String baseUrl = 'https://your-api-domain.com/api';
  final String wsUrl = 'wss://your-api-domain.com';
  
  final List<Function(Map<String, dynamic>)> _messageListeners = [];
  final List<Function(Map<String, dynamic>)> _statusListeners = [];
  final List<Function(Map<String, dynamic>)> _typingListeners = [];

  Future<void> connect() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    
    if (token == null) {
      throw Exception('No authentication token found');
    }

    socket = IO.io(wsUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .enableReconnection()
        .setReconnectionAttempts(5)
        .setReconnectionDelay(1000)
        .build()
    );

    _setupEventListeners();
    
    socket?.connect();
  }

  void _setupEventListeners() {
    socket?.on('connect', (_) {
      print('Connected to chat server');
    });

    socket?.on('new_message', (data) {
      for (var listener in _messageListeners) {
        listener(data['message']);
      }
    });

    socket?.on('user_typing', (data) {
      for (var listener in _typingListeners) {
        listener({...data, 'isTyping': true});
      }
    });

    socket?.on('user_stopped_typing', (data) {
      for (var listener in _typingListeners) {
        listener({...data, 'isTyping': false});
      }
    });

    socket?.on('user_status_changed', (data) {
      for (var listener in _statusListeners) {
        listener(data);
      }
    });

    socket?.on('error', (error) {
      print('Socket error: $error');
    });

    socket?.on('disconnect', (reason) {
      print('Disconnected: $reason');
    });
  }

  // Chat operations
  void joinChat(String chatId) {
    socket?.emit('join_chat', {'chatId': chatId});
  }

  void leaveChat(String chatId) {
    socket?.emit('leave_chat', {'chatId': chatId});
  }

  void sendMessage(String chatId, String content, {String messageType = 'text', String? replyToId}) {
    socket?.emit('send_message', {
      'chatId': chatId,
      'content': content,
      'messageType': messageType,
      if (replyToId != null) 'replyToId': replyToId,
    });
  }

  void startTyping(String chatId) {
    socket?.emit('typing_start', {'chatId': chatId});
  }

  void stopTyping(String chatId) {
    socket?.emit('typing_stop', {'chatId': chatId});
  }

  // Event listeners
  void onNewMessage(Function(Map<String, dynamic>) callback) {
    _messageListeners.add(callback);
  }

  void onUserStatusChange(Function(Map<String, dynamic>) callback) {
    _statusListeners.add(callback);
  }

  void onTypingChange(Function(Map<String, dynamic>) callback) {
    _typingListeners.add(callback);
  }

  // REST API methods
  Future<Map<String, dynamic>> searchUsers(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/search/$userId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  Future<Map<String, dynamic>> getUserChats({int limit = 20, int skip = 0}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chats?limit=$limit&skip=$skip'),
        headers: {'Authorization': 'Bearer $token'},
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  Future<Map<String, dynamic>> getChatMessages(String chatId, {int limit = 50, int skip = 0}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('authToken');
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chats/$chatId/messages?limit=$limit&skip=$skip'),
        headers: {'Authorization': 'Bearer $token'},
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  void disconnect() {
    socket?.disconnect();
    socket = null;
    _messageListeners.clear();
    _statusListeners.clear();
    _typingListeners.clear();
  }
}
```

## Best Practices

### 1. Error Handling

```javascript
// React Native error handling wrapper
class APIClient {
  constructor() {
    this.baseURL = 'https://your-api-domain.com/api';
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.error?.code === 'TOKEN_EXPIRED') {
        await this.handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  async handleTokenExpiration() {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
    // Navigate to login screen
    // NavigationService.navigate('Login');
  }
}
```

### 2. Connection Management

```javascript
// React Native connection manager
class ConnectionManager {
  constructor(chatService) {
    this.chatService = chatService;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      await this.chatService.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Set up connection monitoring
      this.setupConnectionMonitoring();
    } catch (error) {
      console.error('Connection failed:', error);
      this.handleConnectionFailure();
    }
  }

  setupConnectionMonitoring() {
    // Monitor network state
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isConnected) {
        this.reconnect();
      }
    });

    // Monitor app state
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active' && !this.isConnected) {
      this.reconnect();
    } else if (nextAppState === 'background') {
      // Optionally disconnect to save resources
      this.disconnect();
    }
  };

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    try {
      await this.connect();
    } catch (error) {
      // Exponential backoff
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => this.reconnect(), delay);
    }
  }

  disconnect() {
    this.chatService.disconnect();
    this.isConnected = false;
  }
}
```

### 3. Message Caching

```javascript
// React Native message cache
class MessageCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 1000;
  }

  async getCachedMessages(chatId) {
    const cacheKey = `messages_${chatId}`;
    
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to load cached messages:', error);
      return [];
    }
  }

  async cacheMessages(chatId, messages) {
    const cacheKey = `messages_${chatId}`;
    
    try {
      // Limit cache size
      const limitedMessages = messages.slice(-this.maxCacheSize);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(limitedMessages));
    } catch (error) {
      console.error('Failed to cache messages:', error);
    }
  }

  async addMessage(chatId, message) {
    const cached = await this.getCachedMessages(chatId);
    cached.push(message);
    await this.cacheMessages(chatId, cached);
  }

  async clearCache(chatId) {
    const cacheKey = `messages_${chatId}`;
    await AsyncStorage.removeItem(cacheKey);
  }
}
```

## Platform-Specific Considerations

### iOS (React Native)

```javascript
// iOS-specific configurations
import PushNotificationIOS from '@react-native-community/push-notification-ios';

class iOSChatService extends ChatService {
  constructor() {
    super();
    this.setupPushNotifications();
  }

  setupPushNotifications() {
    PushNotificationIOS.addEventListener('notification', this.onRemoteNotification);
    PushNotificationIOS.addEventListener('localNotification', this.onLocalNotification);
    
    // Request permissions
    PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });
  }

  onRemoteNotification = (notification) => {
    const data = notification.getData();
    
    if (data.type === 'new_message') {
      // Handle new message notification
      this.handleNewMessageNotification(data);
    }
  };

  // Background app refresh handling
  handleBackgroundRefresh() {
    // Sync messages when app becomes active
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.syncMessages();
      }
    });
  }
}
```

### Android (React Native)

```javascript
// Android-specific configurations
import { PermissionsAndroid } from 'react-native';
import BackgroundJob from '@react-native-async-storage/async-storage';

class AndroidChatService extends ChatService {
  constructor() {
    super();
    this.setupAndroidSpecific();
  }

  async setupAndroidSpecific() {
    // Request notification permissions (Android 13+)
    if (Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    // Handle background restrictions
    this.setupBackgroundHandling();
  }

  setupBackgroundHandling() {
    // Use foreground service for persistent connection
    // This requires additional native module setup
  }

  // Handle Android back button
  handleBackButton = () => {
    // Custom back button behavior for chat screens
    return true; // Prevent default behavior
  };
}
```

This guide provides comprehensive examples for integrating the Chat Website API into mobile applications, covering authentication, real-time messaging, error handling, and platform-specific considerations.