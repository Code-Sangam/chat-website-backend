const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: {
      type: String,
      default: ''
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ updatedAt: -1 });

// Ensure exactly 2 participants for direct messaging
chatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }
  
  // Ensure participants are unique
  const uniqueParticipants = [...new Set(this.participants.map(p => p.toString()))];
  if (uniqueParticipants.length !== 2) {
    return next(new Error('Chat participants must be unique'));
  }
  
  next();
});

// Static method to find chat between two users
chatSchema.statics.findChatBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    participants: { $all: [userId1, userId2] },
    isActive: true
  }).populate('participants', 'uniqueUserId username isOnline lastActive');
};

// Static method to find all chats for a user
chatSchema.statics.findUserChats = function(userId, limit = 20, skip = 0) {
  return this.find({
    participants: userId,
    isActive: true
  })
  .populate('participants', 'uniqueUserId username isOnline lastActive')
  .populate('lastMessage.sender', 'uniqueUserId username')
  .sort({ updatedAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to create or get existing chat
chatSchema.statics.createOrGetChat = async function(userId1, userId2) {
  // Check if chat already exists
  let chat = await this.findChatBetweenUsers(userId1, userId2);
  
  if (chat) {
    return chat;
  }
  
  // Create new chat
  chat = new this({
    participants: [userId1, userId2]
  });
  
  await chat.save();
  
  // Populate participants for return
  await chat.populate('participants', 'uniqueUserId username isOnline lastActive');
  
  return chat;
};

// Instance method to update last message
chatSchema.methods.updateLastMessage = function(messageData) {
  this.lastMessage = {
    content: messageData.content,
    sender: messageData.sender,
    timestamp: messageData.timestamp || new Date(),
    messageType: messageData.messageType || 'text'
  };
  
  return this.save();
};

// Instance method to get other participant
chatSchema.methods.getOtherParticipant = function(currentUserId) {
  return this.participants.find(
    participant => participant._id.toString() !== currentUserId.toString()
  );
};

// Instance method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(
    participant => participant._id.toString() === userId.toString()
  );
};

// Transform output to include computed fields
chatSchema.methods.toJSON = function() {
  const chatObject = this.toObject();
  
  // Add id field (string version of _id)
  chatObject.id = this._id.toString();
  
  // Add computed fields
  chatObject.participantCount = this.participants.length;
  
  return chatObject;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;