import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// JWT Secret (use Firebase config or environment variable)
const JWT_SECRET = functions.config().jwt?.secret || 'your-jwt-secret';

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, uniqueUserId } = req.body;

    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if uniqueUserId is taken
    const existingUserId = await db.collection('users')
      .where('uniqueUserId', '==', uniqueUserId)
      .get();

    if (!existingUserId.empty) {
      return res.status(400).json({ message: 'User ID already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document
    const userRef = db.collection('users').doc();
    await userRef.set({
      username,
      email,
      uniqueUserId,
      passwordHash: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRef.id, uniqueUserId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userRef.id,
        username,
        email,
        uniqueUserId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userQuery = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userDoc.id, uniqueUserId: userData.uniqueUserId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
        username: userData.username,
        email: userData.email,
        uniqueUserId: userData.uniqueUserId
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User Routes
app.get('/api/users/search/:uniqueUserId', async (req, res) => {
  try {
    const { uniqueUserId } = req.params;

    const userQuery = await db.collection('users')
      .where('uniqueUserId', '==', uniqueUserId)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    res.json({
      id: userDoc.id,
      username: userData.username,
      uniqueUserId: userData.uniqueUserId
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Chat Routes
app.post('/api/chats', async (req, res) => {
  try {
    const { participantId } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUserId = decoded.userId;

    // Check if chat already exists
    const existingChat = await db.collection('chats')
      .where('participants', 'array-contains-any', [currentUserId, participantId])
      .get();

    for (const doc of existingChat.docs) {
      const participants = doc.data().participants;
      if (participants.includes(currentUserId) && participants.includes(participantId)) {
        return res.json({
          chatId: doc.id,
          participants: participants
        });
      }
    }

    // Create new chat
    const chatRef = db.collection('chats').doc();
    await chatRef.set({
      participants: [currentUserId, participantId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null
    });

    res.status(201).json({
      chatId: chatRef.id,
      participants: [currentUserId, participantId]
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions backend is running',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);