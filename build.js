#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting backend build process...');

try {
  // Change to backend directory
  process.chdir(path.join(__dirname, 'backend'));
  
  console.log('📦 Installing production dependencies...');
  execSync('npm install --production', { stdio: 'inherit' });
  
  console.log('🔧 Rebuilding bcrypt for target platform...');
  execSync('npm rebuild bcrypt --build-from-source', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}