const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: [true, 'Chat ID is required'],
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message content cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ createdAt: -1 });

// Pre-save middleware to validate message content
messageSchema.pre('save', function(next) {
  // Ensure content is not empty for text messages
  if (this.messageType === 'text' && (!this.content || this.content.trim().length === 0)) {
    return next(new Error('Text message content cannot be empty'));
  }
  
  // Set editedAt timestamp if content is modified
  if (this.isModified('content') && !this.isNew) {
    this.editedAt = new Date();
  }
  
  next();
});

// Static method to find messages for a chat with pagination
messageSchema.statics.findChatMessages = function(chatId, limit = 50, skip = 0) {
  return this.find({
    chatId,
    isDeleted: false
  })
  .populate('sender', 'uniqueUserId username')
  .populate('replyTo', 'content sender createdAt')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to find messages after a specific timestamp
messageSchema.statics.findMessagesAfter = function(chatId, timestamp) {
  return this.find({
    chatId,
    createdAt: { $gt: timestamp },
    isDeleted: false
  })
  .populate('sender', 'uniqueUserId username')
  .sort({ createdAt: 1 });
};

// Static method to count unread messages for a user in a chat
messageSchema.statics.countUnreadMessages = function(chatId, userId) {
  return this.countDocuments({
    chatId,
    sender: { $ne: userId },
    isDeleted: false,
    'readBy.user': { $ne: userId }
  });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(chatId, userId, messageIds = null) {
  const query = {
    chatId,
    sender: { $ne: userId },
    isDeleted: false,
    'readBy.user': { $ne: userId }
  };
  
  if (messageIds && messageIds.length > 0) {
    query._id = { $in: messageIds };
  }
  
  const messages = await this.find(query);
  
  const updatePromises = messages.map(message => {
    message.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return message.save();
  });
  
  return Promise.all(updatePromises);
};

// Instance method to mark message as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Instance method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to edit message content
messageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// Virtual for checking if message was edited
messageSchema.virtual('isEdited').get(function() {
  return !!this.editedAt;
});

// Transform output to include computed fields
messageSchema.methods.toJSON = function() {
  const messageObject = this.toObject({ virtuals: true });
  
  // Add computed fields
  messageObject.readCount = this.readBy.length;
  
  return messageObject;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;