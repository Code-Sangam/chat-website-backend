// Script to update environment variables after backend deployment
const fs = require('fs');

// Update frontend .env.production with actual backend URL
const frontendEnv = `# Production Environment Variables for Vercel Deployment

# API Configuration (Render backend URL)
VITE_API_URL=https://chat-website-backend.onrender.com/api
VITE_SOCKET_URL=https://chat-website-backend.onrender.com

# Environment
VITE_NODE_ENV=production`;

// Update backend .env.production with actual frontend URL
const backendEnv = `# Production Environment Variables for Render Deployment

# Database Configuration (MongoDB Atlas)
MONGODB_URI=mongodb+srv://chatwebsite:chatwebsite123@cluster0.mongodb.net/chat-website?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=super-secure-jwt-secret-key-for-production-2024

# Server Configuration
PORT=10000
NODE_ENV=production

# Frontend Configuration (actual Vercel URL)
FRONTEND_URL=https://chat-website-frontend-bhm06wcrv-manualuser206-8672s-projects.vercel.app

# Socket Configuration
SOCKET_URL=https://chat-website-backend.onrender.com`;

fs.writeFileSync('frontend/.env.production', frontendEnv);
fs.writeFileSync('backend/.env.production', backendEnv);

console.log('✅ Environment variables updated successfully!');
console.log('Frontend URL:', 'https://chat-website-frontend-bhm06wcrv-manualuser206-8672s-projects.vercel.app');
console.log('Backend URL:', 'https://chat-website-backend.onrender.com');