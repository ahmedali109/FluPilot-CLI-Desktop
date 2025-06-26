// Service Initializer Module
// Initializes all core services for the Electron app

async function initializeServices({
  logger,
  securityManager,
  settingsManager,
  updateManagerRef,
  pluginManager,
  performanceMonitor,
  app,
}) {
  try {
    logger.info('Initializing application services...');

    // Initialize security first
    securityManager.initialize();

    // Load settings
    await settingsManager.loadSettings();

    // Initialize update manager with settings
    updateManagerRef.instance = new (require('../services/UpdateManager.js'))(
      settingsManager
    );
    await updateManagerRef.instance.initialize();

    // Initialize plugin system
    await pluginManager.initialize();

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Execute initialization hook for plugins
    await pluginManager.executeHook('appInitialize', {
      settings: settingsManager.getSettings(),
      version: app.getVersion(),
    });

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', error);
    throw error;
  }
}

module.exports = { initializeServices };
