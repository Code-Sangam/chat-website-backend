const User = require('../models/User');

// Search users by unique ID
const searchUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate search term
    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEARCH_TERM',
          message: 'Search term is required'
        }
      });
    }

    const searchTerm = userId.trim();

    // Validate search term length and format
    if (searchTerm.length > 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEARCH_TERM',
          message: 'Search term cannot exceed 8 characters'
        }
      });
    }

    // Check if search term contains only valid characters
    if (!/^[A-Za-z0-9]+$/.test(searchTerm)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEARCH_TERM',
          message: 'Search term can only contain letters and numbers'
        }
      });
    }

    // First try exact match
    const exactMatch = await User.findByUniqueId(searchTerm);
    
    if (exactMatch) {
      // Don't return the current user in search results
      if (exactMatch._id.toString() === req.userId) {
        return res.json({
          success: true,
          message: 'Search completed',
          data: {
            users: [],
            searchTerm,
            resultCount: 0
          }
        });
      }

      return res.json({
        success: true,
        message: 'User found',
        data: {
          users: [{
            id: exactMatch._id,
            uniqueUserId: exactMatch.uniqueUserId,
            username: exactMatch.username,
            isOnline: exactMatch.isOnline,
            lastActive: exactMatch.lastActive
          }],
          searchTerm,
          resultCount: 1
        }
      });
    }

    // If no exact match, try partial match (only if search term is at least 2 characters)
    if (searchTerm.length >= 2) {
      const partialMatches = await User.searchByUniqueId(searchTerm);
      
      // Filter out current user from results
      const filteredMatches = partialMatches.filter(
        user => user._id.toString() !== req.userId
      );

      // Limit results to prevent overwhelming response
      const limitedResults = filteredMatches.slice(0, 10);

      return res.json({
        success: true,
        message: `Found ${limitedResults.length} user(s)`,
        data: {
          users: limitedResults.map(user => ({
            id: user._id,
            uniqueUserId: user.uniqueUserId,
            username: user.username,
            isOnline: user.isOnline,
            lastActive: user.lastActive
          })),
          searchTerm,
          resultCount: limitedResults.length,
          hasMore: filteredMatches.length > 10
        }
      });
    }

    // No matches found
    return res.json({
      success: true,
      message: 'No users found',
      data: {
        users: [],
        searchTerm,
        resultCount: 0
      }
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during user search'
      }
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          uniqueUserId: user.uniqueUserId,
          username: user.username,
          email: user.email,
          isOnline: user.isOnline,
          lastActive: user.lastActive,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching user profile'
      }
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update username if provided
    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'Username is already taken'
          }
        });
      }

      user.username = username;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          uniqueUserId: user.uniqueUserId,
          username: user.username,
          email: user.email,
          isOnline: user.isOnline,
          lastActive: user.lastActive,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationErrors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating profile'
      }
    });
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  updateUserProfile
};