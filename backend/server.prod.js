require('dotenv').config();
const http = require('http');
const https = require('https');
const app = require('./src/app');
const socketService = require('./src/services/socketService');
const sslConfig = require('./src/config/ssl');
const monitoringService = require('./src/config/monitoring');
const { logger, requestLogger, errorLogger } = require('./src/config/logger');
const { connectDB } = require('./src/config/database.prod');

class ProductionServer {
  constructor() {
    this.server = null;
    this.port = process.env.PORT || 5000;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Initialize SSL configuration
      sslConfig.initialize();

      // Connect to database
      await connectDB();

      // Initialize monitoring
      monitoringService.initialize();

      // Add production middleware
      this.setupProductionMiddleware();

      // Create server (HTTP or HTTPS based on SSL configuration)
      this.createServer();

      // Initialize WebSocket service
      socketService.initialize(this.server);

      // Setup health check endpoints
      this.setupHealthCheckEndpoints();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Setup SSL certificate auto-renewal
      sslConfig.setupAutoRenewal();

      logger.info('Production server initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize production server:', error);
      process.exit(1);
    }
  }

  setupProductionMiddleware() {
    // Request logging
    app.use(requestLogger);

    // Error logging
    app.use(errorLogger);

    // Security headers for HTTPS
    if (sslConfig.isEnabled()) {
      app.use((req, res, next) => {
        const headers = sslConfig.getSecurityHeaders();
        Object.keys(headers).forEach(header => {
          res.setHeader(header, headers[header]);
        });
        next();
      });
    }

    // Request metrics collection
    app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        monitoringService.recordRequest(req, res, responseTime);
      });
      
      next();
    });

    // Force HTTPS redirect in production
    if (process.env.NODE_ENV === 'production' && sslConfig.isEnabled()) {
      app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }
  }

  createServer() {
    if (sslConfig.isEnabled()) {
      // Create HTTPS server
      this.server = https.createServer(sslConfig.getSSLOptions(), app);
      logger.info('HTTPS server created with SSL configuration');
    } else {
      // Create HTTP server
      this.server = http.createServer(app);
      logger.info('HTTP server created (SSL not configured)');
    }

    // Server error handling
    this.server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof this.port === 'string' ? 'Pipe ' + this.port : 'Port ' + this.port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    this.server.on('listening', () => {
      const addr = this.server.address();
      const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
      const protocol = sslConfig.isEnabled() ? 'HTTPS' : 'HTTP';
      
      logger.info(`${protocol} Server listening on ${bind}`);
      
      // Log server startup information
      logger.info('Server startup complete', {
        port: this.port,
        environment: process.env.NODE_ENV,
        ssl: sslConfig.isEnabled(),
        monitoring: process.env.METRICS_ENABLED === 'true',
        pid: process.pid,
        nodeVersion: process.version
      });
    });
  }

  setupHealthCheckEndpoints() {
    // Basic health check
    app.get('/health', (req, res) => {
      const health = monitoringService.healthCheckRoutes['/health']();
      res.json(health);
    });

    // Detailed health check
    app.get('/health/detailed', (req, res) => {
      const health = monitoringService.healthCheckRoutes['/health/detailed']();
      res.json(health);
    });

    // Kubernetes readiness probe
    app.get('/ready', (req, res) => {
      const ready = monitoringService.healthCheckRoutes['/ready']();
      const status = ready.ready ? 200 : 503;
      res.status(status).json(ready);
    });

    // Kubernetes liveness probe
    app.get('/live', (req, res) => {
      res.json({
        alive: true,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint (for Prometheus)
    if (process.env.METRICS_ENABLED === 'true') {
      app.get('/metrics', (req, res) => {
        res.set('Content-Type', 'text/plain');
        res.send(monitoringService.getPrometheusMetrics());
      });

      // JSON metrics endpoint
      app.get('/metrics/json', (req, res) => {
        const metrics = monitoringService.healthCheckRoutes['/metrics']();
        res.json(metrics);
      });
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, forcing exit');
        process.exit(1);
      }

      this.isShuttingDown = true;
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Set a timeout for forced shutdown
      const forceShutdownTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000); // 30 seconds timeout

      try {
        // Stop accepting new connections
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close WebSocket connections
            if (socketService) {
              logger.info('Closing WebSocket connections...');
              // socketService.closeAllConnections();
            }

            // Close database connections
            const mongoose = require('mongoose');
            await mongoose.connection.close();
            logger.info('Database connections closed');

            // Stop monitoring
            monitoringService.shutdown();
            logger.info('Monitoring service stopped');

            // Clear the force shutdown timeout
            clearTimeout(forceShutdownTimeout);

            logger.info('Graceful shutdown completed');
            process.exit(0);

          } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });

        // Stop accepting new HTTP requests
        this.server.keepAliveTimeout = 1000;
        this.server.headersTimeout = 2000;

      } catch (error) {
        logger.error('Error initiating graceful shutdown:', error);
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  start() {
    this.server.listen(this.port);
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

// Initialize and start the production server
const productionServer = new ProductionServer();

// Start server if this file is run directly
if (require.main === module) {
  productionServer.initialize().then(() => {
    productionServer.start();
  }).catch((error) => {
    logger.error('Failed to start production server:', error);
    process.exit(1);
  });
}

module.exports = productionServer;