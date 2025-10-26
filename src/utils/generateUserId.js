const crypto = require('crypto');

/**
 * Generate a unique user ID
 * Format: 8 characters alphanumeric (uppercase)
 * Example: A1B2C3D4
 */
const generateUniqueUserId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Generate a cryptographically secure unique user ID
 * Alternative implementation using crypto for better uniqueness
 */
const generateSecureUserId = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

module.exports = {
  generateUniqueUserId,
  generateSecureUserId
};