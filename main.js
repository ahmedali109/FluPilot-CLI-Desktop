const { app, ipcMain, dialog } = require('electron');
// Fix PATH so npm/node are available in packaged Electron apps on macOS
require('fix-path');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { screen } = require('electron');
const {
  createApplicationMenu,
  setupContextMenus,
} = require('./application-menu.js');
const os = require('os');
const { AppStrings } = require('./appStrings.cjs');
const { APP_CONFIG } = require('./src/config/constants.js');

const Logger = require('./src/utils/logger.js');
const TerminalManager = require('./src/services/TerminalManager.js');
const SettingsManager = require('./src/services/SettingsManager.js');
const PluginManager = require('./src/services/PluginManager.js');
const SecurityManager = require('./src/services/SecurityManager.js');
const PerformanceMonitor = require('./src/services/PerformanceMonitor.js');
const formatBytes = require('./src/utils/formatBytes');

// Refactored modules
const { initializeServices } = require('./src/main/serviceInitializer.js');
const { createWindow } = require('./src/main/windowManager.js');
const setupTerminalIpcHandlers = require('./src/main/ipc-handlers/terminal.js');
const setupSettingsIpcHandlers = require('./src/main/ipc-handlers/settings.js');
const setupPluginIpcHandlers = require('./src/main/ipc-handlers/plugins.js');
const setupUpdateIpcHandlers = require('./src/main/ipc-handlers/update.js');
const setupSecurityIpcHandlers = require('./src/main/ipc-handlers/security.js');
const setupPerformanceIpcHandlers = require('./src/main/ipc-handlers/performance.js');
const setupFileIpcHandlers = require('./src/main/ipc-handlers/files.js');
const setupAppIpcHandlers = require('./src/main/ipc-handlers/app.js');
const setupCommandsIpcHandlers = require('./src/main/ipc-handlers/commands.js');


// Initialize services
const logger = new Logger('Main');
const terminalManager = new TerminalManager();
const settingsManager = new SettingsManager();
const pluginManager = new PluginManager();
const securityManager = new SecurityManager();
const performanceMonitor = new PerformanceMonitor();
let updateManagerRef = { instance: null };
let mainWindowRef = { instance: null };

app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-logging');

// Setup IPC handlers
setupTerminalIpcHandlers({
  ipcMain,
  terminalManager,
  performanceMonitor,
  pluginManager,
  logger,
  getMainWindow: () => mainWindowRef.instance,
});
setupSettingsIpcHandlers({ ipcMain, settingsManager });
setupPluginIpcHandlers({ ipcMain, pluginManager });
setupUpdateIpcHandlers({ ipcMain, updateManager: updateManagerRef.instance });
setupSecurityIpcHandlers({ ipcMain, securityManager });
setupPerformanceIpcHandlers({ ipcMain, performanceMonitor });
setupFileIpcHandlers({ ipcMain });
setupAppIpcHandlers();
setupCommandsIpcHandlers();

// App lifecycle events
app.whenReady().then(async () => {
  try {
    logger.info('App is ready, initializing...');
    // Initialize all services first
    await initializeServices({
      logger,
      securityManager,
      settingsManager,
      updateManagerRef,
      pluginManager,
      performanceMonitor,
      app,
    });
    // Set Custom about panel options
    app.setAboutPanelOptions({
      applicationName: APP_CONFIG.NAME,
      applicationVersion: APP_CONFIG.VERSION,
      copyright: `© ${new Date().getFullYear()} ${APP_CONFIG.AUTHOR}`,
      version: APP_CONFIG.VERSION,
      credits: 'Built with ❤️ using Electron.js',
      authors: APP_CONFIG.AUTHOR,
      iconPath: path.join(__dirname, APP_CONFIG.PATHS.ICON),
    });
    // Create the main window
    await createWindow({
      settingsManager,
      APP_CONFIG,
      pluginManager,
      logger,
      setupContextMenus,
      mainWindowRef,
    });
    // Create the application menu (after window creation so mainWindow is available)
    createApplicationMenu(mainWindowRef.instance, updateManagerRef.instance);
    logger.info('Application initialized successfully');
    // Execute app ready hook
    await pluginManager.executeHook('appReady', {
      mainWindow: mainWindowRef.instance,
      app,
      version: app.getVersion(),
    });
  } catch (error) {
    logger.error('Failed to initialize application', error);
    const { dialog } = require('electron');
    await dialog.showErrorBox(
      'Initialization Error',
      `Failed to start ${APP_CONFIG.NAME}:\n\n${error.message}`
    );
    app.quit();
  }
  app.on('activate', async function () {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
      await createWindow({
        settingsManager,
        APP_CONFIG,
        pluginManager,
        logger,
        setupContextMenus,
        mainWindowRef,
      });
    }
  });
});

app.on('window-all-closed', async () => {
  try {
    logger.info('All windows closed, cleaning up...');
    terminalManager.cleanup();
    await pluginManager.cleanup();
    performanceMonitor.cleanup();
    if (updateManagerRef.instance) updateManagerRef.instance.cleanup();
    await pluginManager.executeHook('appClosing');
    logger.info('Cleanup completed');
  } catch (error) {
    logger.error('Error during cleanup', error);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (require('electron').BrowserWindow.getAllWindows().length === 0) {
    await createWindow({
      settingsManager,
      APP_CONFIG,
      pluginManager,
      logger,
      setupContextMenus,
      mainWindowRef,
    });
  }
});

app.on('before-quit', async event => {
  try {
    await pluginManager.executeHook('beforeQuit');
    await settingsManager.saveSettings();
    logger.info('Application shutting down gracefully');
  } catch (error) {
    logger.error('Error during shutdown', error);
  }
});
// Set working directory to user's home directory if running from root
if (process.cwd() === '/') {
  process.chdir(os.homedir());
}
