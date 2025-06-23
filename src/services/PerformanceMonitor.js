/**
 * Performance monitoring and optimization utilities
 */

const { app, powerMonitor } = require('electron');
const Logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.logger = new Logger('PerformanceMonitor');
    this.metrics = {
      memoryUsage: [],
      cpuUsage: [],
      startTime: Date.now(),
      commandCount: 0,
      terminalSessions: 0,
    };
    this.monitoring = false;
    this.monitoringInterval = null;
  }

  // Start performance monitoring
  startMonitoring(intervalMs = 30000) {
    // 30 seconds by default
    if (this.monitoring) return;

    this.monitoring = true;
    this.monitoringInterval = setInterval(() => {
      this._collectMetrics();
    }, intervalMs);

    // Monitor power events (check if powerMonitor methods exist)
    try {
      if (powerMonitor && typeof powerMonitor.on === 'function') {
        powerMonitor.on('suspend', () => {
          this.logger.info('System suspended - pausing intensive operations');
          this._handlePowerEvent('suspend');
        });

        powerMonitor.on('resume', () => {
          this.logger.info('System resumed - resuming operations');
          this._handlePowerEvent('resume');
        });

        if (typeof powerMonitor.on === 'function') {
          powerMonitor.on('on-ac', () => {
            this._handlePowerEvent('ac-power');
          });

          powerMonitor.on('on-battery', () => {
            this.logger.info('On battery power - enabling power saving mode');
            this._handlePowerEvent('battery-power');
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        'Power monitoring not available on this platform',
        error
      );
    }

    this.logger.info(
      `Performance monitoring started (interval: ${intervalMs}ms)`
    );
  }

  // Stop performance monitoring
  stopMonitoring() {
    if (!this.monitoring) return;

    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.info('Performance monitoring stopped');
  }

  // Collect system metrics
  _collectMetrics() {
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      });

      // CPU usage
      const cpuUsage = process.cpuUsage();
      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system,
      });

      // Keep only last 100 entries to prevent memory leak
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
      if (this.metrics.cpuUsage.length > 100) {
        this.metrics.cpuUsage.shift();
      }

      // Check for memory leaks
      this._checkMemoryLeaks();
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  // Check for potential memory leaks
  _checkMemoryLeaks() {
    const recentMetrics = this.metrics.memoryUsage.slice(-10); // Last 10 measurements
    if (recentMetrics.length < 10) return;

    const memoryGrowth = recentMetrics.map(metric => metric.heapUsed);
    const averageGrowth =
      memoryGrowth.reduce((sum, current, index, array) => {
        if (index === 0) return 0;
        return sum + (current - array[index - 1]);
      }, 0) /
      (memoryGrowth.length - 1);

    // Alert if memory is consistently growing (potential leak)
    const thresholdBytes = 50 * 1024 * 1024; // 50MB threshold
    if (averageGrowth > thresholdBytes / 10) {
      // 5MB per measurement
      this.logger.warn('Potential memory leak detected', {
        averageGrowth: this._formatBytes(averageGrowth),
        currentHeapUsed: this._formatBytes(
          recentMetrics[recentMetrics.length - 1].heapUsed
        ),
      });
    }
  }

  // Handle power events
  _handlePowerEvent(event) {
    switch (event) {
      case 'suspend':
        // Pause non-essential operations
        break;
      case 'resume':
        // Resume operations
        break;
      case 'battery-power':
        // Enable power saving mode
        this._enablePowerSaving();
        break;
      case 'ac-power':
        // Disable power saving mode
        this._disablePowerSaving();
        break;
    }
  }

  // Enable power saving mode
  _enablePowerSaving() {
    // Reduce monitoring frequency
    if (this.monitoring && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(() => {
        this._collectMetrics();
      }, 60000); // 1 minute on battery
    }
  }

  // Disable power saving mode
  _disablePowerSaving() {
    // Restore normal monitoring frequency
    if (this.monitoring && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(() => {
        this._collectMetrics();
      }, 30000); // 30 seconds on AC
    }
  }

  // Increment command counter
  incrementCommandCount() {
    this.metrics.commandCount++;
  }

  // Increment terminal session counter
  incrementTerminalSessions() {
    this.metrics.terminalSessions++;
  }

  // Get performance report
  getPerformanceReport() {
    const uptime = Date.now() - this.metrics.startTime;
    const latestMemory =
      this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const latestCpu = this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1];

    return {
      uptime: this._formatUptime(uptime),
      uptimeMs: uptime,
      memory: latestMemory
        ? {
            rss: this._formatBytes(latestMemory.rss),
            heapUsed: this._formatBytes(latestMemory.heapUsed),
            heapTotal: this._formatBytes(latestMemory.heapTotal),
            external: this._formatBytes(latestMemory.external),
          }
        : null,
      cpu: latestCpu,
      stats: {
        commandsExecuted: this.metrics.commandCount,
        terminalSessionsCreated: this.metrics.terminalSessions,
        averageMemoryUsage: this._getAverageMemoryUsage(),
      },
      isMonitoring: this.monitoring,
      powerStatus: {
        onBattery: this._getPowerStatus('isOnBatteryPower'),
        idleTime: this._getPowerStatus('getSystemIdleTime'),
      },
    };
  }

  // Helper method to safely get power status
  _getPowerStatus(method) {
    try {
      if (powerMonitor && typeof powerMonitor[method] === 'function') {
        return powerMonitor[method]();
      }
    } catch (error) {
      this.logger.debug(`Power status method ${method} not available`, error);
    }
    return null;
  }

  // Get average memory usage
  _getAverageMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;

    const total = this.metrics.memoryUsage.reduce(
      (sum, metric) => sum + metric.heapUsed,
      0
    );
    return this._formatBytes(total / this.metrics.memoryUsage.length);
  }

  // Format bytes to human readable
  _formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Format uptime to human readable
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Get historical data for charts
  getHistoricalData(type = 'memory', limit = 50) {
    const data = this.metrics[type === 'memory' ? 'memoryUsage' : 'cpuUsage'];
    return data.slice(-limit);
  }

  // Cleanup
  cleanup() {
    this.stopMonitoring();
    this.metrics = {
      memoryUsage: [],
      cpuUsage: [],
      startTime: Date.now(),
      commandCount: 0,
      terminalSessions: 0,
    };
  }
}

module.exports = PerformanceMonitor;
