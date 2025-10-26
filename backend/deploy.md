# Backend Deployment to Render

## Deployment URL
- **Service:** https://render.com
- **Repository:** https://github.com/Code-Sangam/chat-website-backend

## Configuration
```
Name: chat-website-backend
Environment: Node
Build Command: npm ci --only=production && npm rebuild bcrypt --build-from-source
Start Command: npm start
Plan: Free
```

## Environment Variables
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://chatwebsite:chatwebsite123@cluster0.mongodb.net/chat-website?retryWrites=true&w=majority
JWT_SECRET=super-secure-jwt-secret-key-for-production-2024
FRONTEND_URL=https://chat-website-frontend-bhm06wcrv-manualuser206-8672s-projects.vercel.app
```

## Expected URL
https://chat-website-backend.onrender.com