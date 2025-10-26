// Environment Variable Checker
// Validates all required environment variables

class EnvironmentChecker {
  constructor() {
    this.requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];
    
    this.optionalVars = [
      'PORT',
      'NODE_ENV',
      'FRONTEND_URL',
      'JWT_EXPIRES_IN',
      'REDIS_URL',
      'LOG_LEVEL',
      'SSL_CERT_PATH',
      'SSL_KEY_PATH'
    ];
  }

  checkEnvironment() {
    console.log('🔍 Checking environment variables...');
    
    const missing = [];
    const present = [];
    const issues = [];

    // Check required variables
    this.requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
        console.log(`❌ MISSING REQUIRED: ${varName}`);
      } else {
        present.push(varName);
        console.log(`✅ PRESENT: ${varName} = ${this.maskSensitive(varName, value)}`);
        
        // Validate specific variables
        this.validateVariable(varName, value, issues);
      }
    });

    // Check optional variables
    this.optionalVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`📋 OPTIONAL: ${varName} = ${this.maskSensitive(varName, value)}`);
      } else {
        console.log(`⚪ NOT SET: ${varName} (optional)`);
      }
    });

    // Summary
    console.log('\n📊 ENVIRONMENT SUMMARY:');
    console.log(`✅ Required variables present: ${present.length}/${this.requiredVars.length}`);
    console.log(`❌ Missing required variables: ${missing.length}`);
    console.log(`⚠️ Validation issues: ${issues.length}`);

    if (missing.length > 0) {
      console.log('\n🚨 CRITICAL: Missing required environment variables!');
      console.log('The server may fail to start or function properly.');
      console.log('Missing variables:', missing.join(', '));
    }

    if (issues.length > 0) {
      console.log('\n⚠️ VALIDATION ISSUES:');
      issues.forEach(issue => console.log(`- ${issue}`));
    }

    return {
      valid: missing.length === 0 && issues.length === 0,
      missing,
      issues,
      present
    };
  }

  maskSensitive(varName, value) {
    const sensitiveVars = ['JWT_SECRET', 'MONGODB_URI', 'REDIS_URL'];
    
    if (sensitiveVars.includes(varName)) {
      if (value.length <= 10) {
        return '*'.repeat(value.length);
      }
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }
    
    return value;
  }

  validateVariable(varName, value, issues) {
    switch (varName) {
      case 'MONGODB_URI':
        if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
          issues.push(`MONGODB_URI should start with mongodb:// or mongodb+srv://`);
        }
        if (value.includes('localhost') && process.env.NODE_ENV === 'production') {
          issues.push(`MONGODB_URI uses localhost in production environment`);
        }
        break;
        
      case 'JWT_SECRET':
        if (value.length < 32) {
          issues.push(`JWT_SECRET should be at least 32 characters long (current: ${value.length})`);
        }
        if (value === 'your-super-secret-jwt-key-here') {
          issues.push(`JWT_SECRET is using the default example value`);
        }
        break;
        
      case 'PORT':
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          issues.push(`PORT should be a valid port number (1-65535)`);
        }
        break;
    }
  }

  // Generate environment template
  generateTemplate() {
    console.log('\n📝 ENVIRONMENT TEMPLATE:');
    console.log('# Copy this to your .env file or Render environment variables\n');
    
    console.log('# Required Variables:');
    this.requiredVars.forEach(varName => {
      console.log(`${varName}=`);
    });
    
    console.log('\n# Optional Variables:');
    this.optionalVars.forEach(varName => {
      console.log(`# ${varName}=`);
    });
  }
}

module.exports = EnvironmentChecker;