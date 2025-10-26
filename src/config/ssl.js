const fs = require('fs');
const https = require('https');
const path = require('path');

class SSLConfig {
  constructor() {
    this.sslOptions = null;
    this.isSSLEnabled = false;
  }

  // Initialize SSL configuration
  initialize() {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      try {
        this.loadSSLCertificates();
        this.isSSLEnabled = true;
        console.log('SSL/HTTPS configuration loaded successfully');
      } catch (error) {
        console.error('Failed to load SSL certificates:', error.message);
        console.log('Falling back to HTTP mode');
        this.isSSLEnabled = false;
      }
    } else {
      console.log('Development mode: SSL disabled');
      this.isSSLEnabled = false;
    }
  }

  // Load SSL certificates
  loadSSLCertificates() {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    const caPath = process.env.SSL_CA_PATH; // Optional CA bundle

    if (!certPath || !keyPath) {
      throw new Error('SSL certificate paths not configured');
    }

    // Check if certificate files exist
    if (!fs.existsSync(certPath)) {
      throw new Error(`SSL certificate file not found: ${certPath}`);
    }

    if (!fs.existsSync(keyPath)) {
      throw new Error(`SSL private key file not found: ${keyPath}`);
    }

    // Load certificate files
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    
    this.sslOptions = {
      cert: cert,
      key: key,
      // Security options
      secureProtocol: 'TLSv1_2_method',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384'
      ].join(':'),
      honorCipherOrder: true,
      // HSTS settings
      secureOptions: require('constants').SSL_OP_NO_SSLv3 | require('constants').SSL_OP_NO_TLSv1,
    };

    // Load CA bundle if provided
    if (caPath && fs.existsSync(caPath)) {
      this.sslOptions.ca = fs.readFileSync(caPath, 'utf8');
    }

    // Validate certificates
    this.validateCertificates();
  }

  // Validate SSL certificates
  validateCertificates() {
    try {
      // Create a temporary server to test certificate validity
      const testServer = https.createServer(this.sslOptions);
      testServer.close();
      console.log('SSL certificates validated successfully');
    } catch (error) {
      throw new Error(`Invalid SSL certificates: ${error.message}`);
    }
  }

  // Get SSL options for server creation
  getSSLOptions() {
    return this.sslOptions;
  }

  // Check if SSL is enabled
  isEnabled() {
    return this.isSSLEnabled;
  }

  // Get security headers for HTTPS
  getSecurityHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSPHeader(),
    };
  }

  // Generate Content Security Policy header
  getCSPHeader() {
    const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:3000';
    const wsProtocol = this.isSSLEnabled ? 'wss:' : 'ws:';
    
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      `connect-src 'self' ${frontendUrl} ${wsProtocol}`,
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Certificate renewal check
  checkCertificateExpiry() {
    if (!this.sslOptions || !this.sslOptions.cert) {
      return null;
    }

    try {
      const crypto = require('crypto');
      const cert = new crypto.X509Certificate(this.sslOptions.cert);
      const expiryDate = new Date(cert.validTo);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      return {
        expiryDate: expiryDate,
        daysUntilExpiry: daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 30,
        isExpired: daysUntilExpiry <= 0
      };
    } catch (error) {
      console.error('Error checking certificate expiry:', error);
      return null;
    }
  }

  // Auto-renewal setup (placeholder for integration with Let's Encrypt or similar)
  setupAutoRenewal() {
    if (process.env.SSL_AUTO_RENEWAL_ENABLED === 'true') {
      // Check certificate expiry daily
      setInterval(() => {
        const expiryInfo = this.checkCertificateExpiry();
        if (expiryInfo && expiryInfo.isExpiringSoon) {
          console.warn(`SSL certificate expires in ${expiryInfo.daysUntilExpiry} days`);
          // Trigger renewal process here
          this.triggerCertificateRenewal();
        }
      }, 24 * 60 * 60 * 1000); // Check daily
    }
  }

  // Trigger certificate renewal (implement based on your certificate provider)
  triggerCertificateRenewal() {
    console.log('Certificate renewal triggered');
    // Implement renewal logic here
    // This could involve calling Let's Encrypt API, notifying administrators, etc.
  }
}

// Create singleton instance
const sslConfig = new SSLConfig();

module.exports = sslConfig;