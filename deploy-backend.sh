#!/bin/bash

# Backend Deployment Script for Render

echo "🚀 Starting backend deployment..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Rebuild bcrypt for the target platform
echo "🔧 Rebuilding bcrypt..."
npm rebuild bcrypt --build-from-source

# Start the server
echo "🌟 Starting server..."
npm start