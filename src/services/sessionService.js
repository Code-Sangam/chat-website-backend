const jwt = require('jsonwebtoken');

class SessionService {
  constructor() {
    this.activeSessions = new Map(); // In-memory session store for development
    // In production, this would use Redis
  }

  // Create a new session
  createSession(userId, token) {
    const sessionData = {
      userId,
      token,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    this.activeSessions.set(token, sessionData);
    return sessionData;
  }

  // Get session by token
  getSession(token) {
    return this.activeSessions.get(token);
  }

  // Update session activity
  updateSessionActivity(token) {
    const session = this.activeSessions.get(token);
    if (session) {
      session.lastActivity = new Date();
      this.activeSessions.set(token, session);
    }
    return session;
  }

  // Invalidate session
  invalidateSession(token) {
    const session = this.activeSessions.get(token);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(token);
    }
    return session;
  }

  // Invalidate all sessions for a user
  invalidateUserSessions(userId) {
    const invalidatedSessions = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
        this.activeSessions.delete(token);
        invalidatedSessions.push(session);
      }
    }
    
    return invalidatedSessions;
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    const expiredTokens = [];

    for (const [token, session] of this.activeSessions.entries()) {
      try {
        // Verify if JWT token is still valid
        jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if session has been inactive for too long (24 hours)
        const inactiveTime = now - session.lastActivity;
        const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours
        
        if (inactiveTime > maxInactiveTime) {
          expiredTokens.push(token);
        }
      } catch (error) {
        // Token is invalid/expired, mark for removal
        expiredTokens.push(token);
      }
    }

    // Remove expired sessions
    expiredTokens.forEach(token => {
      this.activeSessions.delete(token);
    });

    return expiredTokens.length;
  }

  // Get all active sessions for a user
  getUserSessions(userId) {
    const userSessions = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push({
          ...session,
          token: token.substring(0, 10) + '...' // Partial token for security
        });
      }
    }
    
    return userSessions;
  }

  // Get session statistics
  getSessionStats() {
    const totalSessions = this.activeSessions.size;
    const activeSessions = Array.from(this.activeSessions.values())
      .filter(session => session.isActive).length;

    return {
      total: totalSessions,
      active: activeSessions,
      inactive: totalSessions - activeSessions
    };
  }
}

// Create singleton instance
const sessionService = new SessionService();

// Clean up expired sessions every hour
setInterval(() => {
  const cleanedCount = sessionService.cleanupExpiredSessions();
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  }
}, 60 * 60 * 1000); // 1 hour

module.exports = sessionService;