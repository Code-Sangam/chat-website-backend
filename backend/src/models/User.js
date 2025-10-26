const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { generateUniqueUserId } = require('../utils/generateUserId');

const userSchema = new mongoose.Schema({
  uniqueUserId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 8
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes are already created by unique: true, no need for additional indexes

// Pre-save middleware to generate unique user ID
userSchema.pre('validate', async function(next) {
  if (this.isNew && !this.uniqueUserId) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      const candidateId = generateUniqueUserId();
      const existingUser = await this.constructor.findOne({ uniqueUserId: candidateId });
      
      if (!existingUser) {
        this.uniqueUserId = candidateId;
        isUnique = true;
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      return next(new Error('Failed to generate unique user ID'));
    }
  }
  
  next();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Instance method to set online status
userSchema.methods.setOnlineStatus = function(isOnline) {
  this.isOnline = isOnline;
  if (isOnline) {
    this.lastActive = new Date();
  }
  return this.save();
};

// Static method to find user by unique ID
userSchema.statics.findByUniqueId = function(uniqueUserId) {
  return this.findOne({ uniqueUserId: uniqueUserId.toUpperCase() });
};

// Static method to search users by unique ID pattern
userSchema.statics.searchByUniqueId = function(searchTerm) {
  const pattern = new RegExp(searchTerm.toUpperCase(), 'i');
  return this.find({ 
    uniqueUserId: pattern 
  }).select('uniqueUserId username isOnline lastActive');
};

// Transform output to remove sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;