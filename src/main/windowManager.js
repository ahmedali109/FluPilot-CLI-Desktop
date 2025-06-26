// Window Manager Module
// Handles creation and management of the main Electron window

const { BrowserWindow, app, screen } = require('electron');
const path = require('path');

async function createWindow({
  settingsManager,
  APP_CONFIG,
  pluginManager,
  logger,
  setupContextMenus,
  mainWindowRef,
}) {
  try {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const settings = settingsManager.getSettings();

    // Use settings for window configuration
    const windowConfig = {
      width: settings.window.width || width,
      height: settings.window.height || height,
      x: settings.window.x,
      y: settings.window.y,
      minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
      minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../../' + APP_CONFIG.PATHS.PRELOAD),
        sandbox: false,
        webSecurity: true,
      },
      titleBarStyle: 'hiddenInset',
      title: APP_CONFIG.NAME,
      icon: path.join(__dirname, '../../' + APP_CONFIG.PATHS.ICON),
      show: false, // Don't show until ready-to-show
    };

    mainWindowRef.instance = new BrowserWindow(windowConfig);

    // Handle window events
    mainWindowRef.instance.once('ready-to-show', () => {
      if (settings.window.maximized) {
        mainWindowRef.instance.maximize();
      }
      mainWindowRef.instance.show();
      if (process.platform === 'darwin') {
        app.focus();
      }
    });

    // Save window state on close
    mainWindowRef.instance.on('close', async () => {
      if (!mainWindowRef.instance.isDestroyed()) {
        const bounds = mainWindowRef.instance.getBounds();
        const isMaximized = mainWindowRef.instance.isMaximized();
        await settingsManager.updateSettings({
          window: {
            ...settings.window,
            ...bounds,
            maximized: isMaximized,
          },
        });
      }
    });

    mainWindowRef.instance.loadFile(APP_CONFIG.PATHS.TERMINAL_PAGE);

    // Open DevTools automatically in development
    if (APP_CONFIG.IS_DEVELOPMENT) {
      mainWindowRef.instance.webContents.openDevTools();
      logger.info('Development mode detected - DevTools opened');
    }

    // Set up context menus
    setupContextMenus(mainWindowRef.instance);

    // Execute window created hook
    await pluginManager.executeHook('windowCreated', {
      window: mainWindowRef.instance,
    });

    logger.info('Main window created successfully');
  } catch (error) {
    logger.error('Failed to create window', error);
    throw error;
  }
}

module.exports = { createWindow };
