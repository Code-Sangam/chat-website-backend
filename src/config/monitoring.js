const os = require('os');
const process = require('process');
const { logger, performanceLogger } = require('./logger');
const { checkDatabaseHealth, getDatabaseMetrics } = require('./database.prod');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        averageResponseTime: 0
      },
      websocket: {
        connections: 0,
        messages: 0,
        errors: 0
      },
      system: {
        memory: {},
        cpu: {},
        uptime: 0
      },
      database: {
        healthy: false,
        connections: 0,
        latency: 0
      }
    };

    this.responseTimes = [];
    this.maxResponseTimeHistory = 1000;
    this.isMonitoring = false;
  }

  // Initialize monitoring
  initialize() {
    if (process.env.METRICS_ENABLED === 'true') {
      this.startMonitoring();
      this.setupHealthChecks();
      this.setupAlerts();
      logger.info('Monitoring service initialized');
    }
  }

  // Start monitoring processes
  startMonitoring() {
    this.isMonitoring = true;

    // System metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000);

    // Database health check
    setInterval(() => {
      this.checkDatabaseHealth();
    }, 60000); // Check every minute

    // Memory leak detection
    setInterval(() => {
      this.checkMemoryLeaks();
    }, 300000); // Check every 5 minutes
  }

  // Collect system metrics
  collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      this.metrics.system.memory = {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        systemTotal: totalMem,
        systemUsed: usedMem,
        systemFree: freeMem,
        usagePercentage: (usedMem / totalMem) * 100
      };

      // CPU metrics
      const cpus = os.cpus();
      this.metrics.system.cpu = {
        count: cpus.length,
        model: cpus[0].model,
        loadAverage: os.loadavg(),
        usage: this.calculateCPUUsage()
      };

      // Uptime
      this.metrics.system.uptime = process.uptime();

      // Check for high resource usage
      this.checkResourceUsage();

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  // Calculate CPU usage
  calculateCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      const health = await checkDatabaseHealth();
      const metrics = await getDatabaseMetrics();

      this.metrics.database = {
        healthy: health.healthy,
        latency: health.latency || 0,
        error: health.error || null,
        ...metrics
      };

      if (!health.healthy) {
        logger.error('Database health check failed', { error: health.error });
      }

    } catch (error) {
      this.metrics.database.healthy = false;
      this.metrics.database.error = error.message;
      logger.error('Database health check error:', error);
    }
  }

  // Check for resource usage issues
  checkResourceUsage() {
    const memUsage = this.metrics.system.memory.usagePercentage;
    const cpuUsage = this.metrics.system.cpu.usage;

    // Memory usage alerts
    if (memUsage > 90) {
      performanceLogger.logHighMemoryUsage(memUsage);
      this.triggerAlert('HIGH_MEMORY_USAGE', { usage: memUsage });
    }

    // CPU usage alerts
    if (cpuUsage > 80) {
      performanceLogger.logHighCPUUsage(cpuUsage);
      this.triggerAlert('HIGH_CPU_USAGE', { usage: cpuUsage });
    }

    // Heap usage alerts
    const heapUsage = (this.metrics.system.memory.heapUsed / this.metrics.system.memory.heapTotal) * 100;
    if (heapUsage > 85) {
      this.triggerAlert('HIGH_HEAP_USAGE', { usage: heapUsage });
    }
  }

  // Check for memory leaks
  checkMemoryLeaks() {
    const currentHeap = this.metrics.system.memory.heapUsed;
    
    if (!this.previousHeapUsage) {
      this.previousHeapUsage = currentHeap;
      return;
    }

    const heapGrowth = currentHeap - this.previousHeapUsage;
    const growthPercentage = (heapGrowth / this.previousHeapUsage) * 100;

    // Alert if heap grows by more than 20% in 5 minutes
    if (growthPercentage > 20) {
      logger.warn('Potential memory leak detected', {
        previousHeap: this.previousHeapUsage,
        currentHeap: currentHeap,
        growth: heapGrowth,
        growthPercentage: growthPercentage
      });
      
      this.triggerAlert('MEMORY_LEAK_DETECTED', {
        growth: heapGrowth,
        growthPercentage: growthPercentage
      });
    }

    this.previousHeapUsage = currentHeap;
  }

  // Record HTTP request metrics
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Track response times
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Calculate average response time
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Alert on slow responses
    if (responseTime > 5000) { // 5 seconds
      logger.warn('Slow response detected', {
        url: req.originalUrl,
        method: req.method,
        responseTime: responseTime,
        statusCode: res.statusCode
      });
    }
  }

  // Record WebSocket metrics
  recordWebSocketConnection() {
    this.metrics.websocket.connections++;
  }

  recordWebSocketDisconnection() {
    this.metrics.websocket.connections--;
  }

  recordWebSocketMessage() {
    this.metrics.websocket.messages++;
  }

  recordWebSocketError() {
    this.metrics.websocket.errors++;
  }

  // Setup health check endpoints
  setupHealthChecks() {
    // This would be integrated into your Express app
    this.healthCheckRoutes = {
      // Basic health check
      '/health': () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      }),

      // Detailed health check
      '/health/detailed': () => ({
        status: this.getOverallHealth(),
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: this.metrics.database.healthy ? 'healthy' : 'unhealthy',
            latency: this.metrics.database.latency
          },
          memory: {
            status: this.metrics.system.memory.usagePercentage < 90 ? 'healthy' : 'warning',
            usage: this.metrics.system.memory.usagePercentage
          },
          cpu: {
            status: this.metrics.system.cpu.usage < 80 ? 'healthy' : 'warning',
            usage: this.metrics.system.cpu.usage
          }
        }
      }),

      // Metrics endpoint
      '/metrics': () => this.metrics,

      // Ready check (for Kubernetes)
      '/ready': () => ({
        ready: this.metrics.database.healthy,
        timestamp: new Date().toISOString()
      })
    };
  }

  // Get overall system health
  getOverallHealth() {
    const dbHealthy = this.metrics.database.healthy;
    const memoryOk = this.metrics.system.memory.usagePercentage < 95;
    const cpuOk = this.metrics.system.cpu.usage < 90;

    if (dbHealthy && memoryOk && cpuOk) {
      return 'healthy';
    } else if (dbHealthy && (memoryOk || cpuOk)) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  // Setup alerting
  setupAlerts() {
    this.alertHandlers = {
      HIGH_MEMORY_USAGE: (data) => {
        // Send alert to monitoring service (e.g., Slack, email, PagerDuty)
        logger.error('ALERT: High memory usage detected', data);
      },
      
      HIGH_CPU_USAGE: (data) => {
        logger.error('ALERT: High CPU usage detected', data);
      },
      
      DATABASE_DOWN: (data) => {
        logger.error('ALERT: Database connection lost', data);
      },
      
      MEMORY_LEAK_DETECTED: (data) => {
        logger.error('ALERT: Potential memory leak detected', data);
      },
      
      HIGH_ERROR_RATE: (data) => {
        logger.error('ALERT: High error rate detected', data);
      }
    };
  }

  // Trigger alert
  triggerAlert(alertType, data) {
    const handler = this.alertHandlers[alertType];
    if (handler) {
      handler(data);
    }

    // Could integrate with external alerting services here
    // e.g., Slack webhooks, email notifications, PagerDuty, etc.
  }

  // Get metrics for external monitoring systems
  getPrometheusMetrics() {
    // Format metrics for Prometheus scraping
    return `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{status="success"} ${this.metrics.requests.success}
http_requests_total{status="error"} ${this.metrics.requests.errors}

# HELP http_request_duration_ms Average HTTP request duration in milliseconds
# TYPE http_request_duration_ms gauge
http_request_duration_ms ${this.metrics.requests.averageResponseTime}

# HELP websocket_connections Current WebSocket connections
# TYPE websocket_connections gauge
websocket_connections ${this.metrics.websocket.connections}

# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="rss"} ${this.metrics.system.memory.rss}
memory_usage_bytes{type="heap_used"} ${this.metrics.system.memory.heapUsed}
memory_usage_bytes{type="heap_total"} ${this.metrics.system.memory.heapTotal}

# HELP cpu_usage_percent CPU usage percentage
# TYPE cpu_usage_percent gauge
cpu_usage_percent ${this.metrics.system.cpu.usage}

# HELP database_healthy Database health status (1 = healthy, 0 = unhealthy)
# TYPE database_healthy gauge
database_healthy ${this.metrics.database.healthy ? 1 : 0}
    `.trim();
  }

  // Graceful shutdown
  shutdown() {
    this.isMonitoring = false;
    logger.info('Monitoring service shutdown');
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;