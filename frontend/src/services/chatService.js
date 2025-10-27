// Firebase real-time chat service (replaces Socket.io)
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

class ChatService {
  constructor() {
    this.messageListeners = new Map();
  }

  // Send a message to a chat
  async sendMessage(chatId, senderId, content) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId,
        content,
        timestamp: serverTimestamp(),
        chatId
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages in a chat (real-time)
  subscribeToMessages(chatId, callback) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });

    this.messageListeners.set(chatId, unsubscribe);
    return unsubscribe;
  }

  // Stop listening to messages
  unsubscribeFromMessages(chatId) {
    const unsubscribe = this.messageListeners.get(chatId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(chatId);
    }
  }

  // Get user's chats
  async getUserChats(userId) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', userId));
      const snapshot = await getDocs(q);
      
      const chats = [];
      for (const docSnap of snapshot.docs) {
        const chatData = docSnap.data();
        
        // Get participant details
        const participants = [];
        for (const participantId of chatData.participants) {
          if (participantId !== userId) {
            const userDoc = await getDoc(doc(db, 'users', participantId));
            if (userDoc.exists()) {
              participants.push({
                id: participantId,
                ...userDoc.data()
              });
            }
          }
        }

        chats.push({
          id: docSnap.id,
          ...chatData,
          otherParticipants: participants
        });
      }

      return chats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Clean up all listeners
  cleanup() {
    this.messageListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.messageListeners.clear();
  }
}

export default new ChatService();