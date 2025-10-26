// Backend Diagnostic Tool
// Run this to check backend health and identify issues

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://chat-website-backend-3d1p.onrender.com';

class BackendDiagnostic {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.results.push(logEntry);
  }

  async checkHealth() {
    this.log('🔍 Starting backend diagnostic...');
    
    try {
      await this.testHealthEndpoint();
      await this.testDNSResolution();
      await this.testSSLCertificate();
      await this.testCORSHeaders();
      await this.testAPIEndpoints();
    } catch (error) {
      this.log(`Diagnostic failed: ${error.message}`, 'error');
    }

    this.log('📋 Diagnostic complete');
    return this.results;
  }

  async testHealthEndpoint() {
    this.log('Testing health endpoint...');
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.get(`${BACKEND_URL}/health`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Backend-Diagnostic/1.0',
          'Accept': 'application/json'
        }
      }, (res) => {
        const duration = Date.now() - startTime;
        this.log(`✅ Health endpoint responded in ${duration}ms with status ${res.statusCode}`);
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            this.log(`📊 Health response: ${JSON.stringify(parsed)}`);
          } catch (e) {
            this.log(`⚠️ Health response not JSON: ${data.substring(0, 100)}`);
          }
          resolve();
        });
      });

      req.on('timeout', () => {
        this.log('❌ Health endpoint timed out (30s)', 'error');
        req.destroy();
        resolve();
      });

      req.on('error', (error) => {
        this.log(`❌ Health endpoint error: ${error.message}`, 'error');
        resolve();
      });
    });
  }

  async testDNSResolution() {
    this.log('Testing DNS resolution...');
    
    const dns = require('dns');
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      dns.lookup('chat-website-backend-3d1p.onrender.com', (err, address) => {
        const duration = Date.now() - startTime;
        
        if (err) {
          this.log(`❌ DNS resolution failed in ${duration}ms: ${err.message}`, 'error');
        } else {
          this.log(`✅ DNS resolved in ${duration}ms to ${address}`);
        }
        resolve();
      });
    });
  }

  async testSSLCertificate() {
    this.log('Testing SSL certificate...');
    
    const tls = require('tls');
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const socket = tls.connect(443, 'chat-website-backend-3d1p.onrender.com', () => {
        const duration = Date.now() - startTime;
        const cert = socket.getPeerCertificate();
        
        this.log(`✅ SSL connection established in ${duration}ms`);
        this.log(`📜 SSL cert valid until: ${cert.valid_to}`);
        
        socket.end();
        resolve();
      });

      socket.on('error', (error) => {
        this.log(`❌ SSL connection failed: ${error.message}`, 'error');
        resolve();
      });

      socket.setTimeout(10000, () => {
        this.log('❌ SSL connection timed out', 'error');
        socket.destroy();
        resolve();
      });
    });
  }

  async testCORSHeaders() {
    this.log('Testing CORS headers...');
    
    return new Promise((resolve) => {
      const req = https.request(`${BACKEND_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://chat-website-frontend-e3an3wwht-manualuser206-8672s-projects.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      }, (res) => {
        this.log(`✅ CORS preflight status: ${res.statusCode}`);
        
        const corsHeaders = {
          'access-control-allow-origin': res.headers['access-control-allow-origin'],
          'access-control-allow-methods': res.headers['access-control-allow-methods'],
          'access-control-allow-headers': res.headers['access-control-allow-headers']
        };
        
        this.log(`📋 CORS headers: ${JSON.stringify(corsHeaders)}`);
        resolve();
      });

      req.on('error', (error) => {
        this.log(`❌ CORS test failed: ${error.message}`, 'error');
        resolve();
      });

      req.setTimeout(10000, () => {
        this.log('❌ CORS test timed out', 'error');
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  async testAPIEndpoints() {
    this.log('Testing API endpoints...');
    
    const endpoints = [
      '/api/auth/signin',
      '/api/users/search',
      '/api/chats'
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.request(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://chat-website-frontend-e3an3wwht-manualuser206-8672s-projects.vercel.app'
        },
        timeout: 15000
      }, (res) => {
        const duration = Date.now() - startTime;
        this.log(`📡 ${endpoint} responded in ${duration}ms with status ${res.statusCode}`);
        resolve();
      });

      req.on('timeout', () => {
        this.log(`❌ ${endpoint} timed out (15s)`, 'error');
        req.destroy();
        resolve();
      });

      req.on('error', (error) => {
        this.log(`❌ ${endpoint} error: ${error.message}`, 'error');
        resolve();
      });

      // Send empty JSON for POST requests
      req.write('{}');
      req.end();
    });
  }
}

// Run diagnostic
async function runDiagnostic() {
  const diagnostic = new BackendDiagnostic();
  await diagnostic.checkHealth();
}

if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = BackendDiagnostic;