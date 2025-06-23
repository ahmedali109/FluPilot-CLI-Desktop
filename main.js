const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { screen } = require('electron');
const {
  createApplicationMenu,
  setupContextMenus,
} = require('./application-menu.js');
const { AppStrings } = require('./appStrings.cjs');

// Import new services
const { APP_CONFIG } = require('./src/config/constants.js');
const Logger = require('./src/utils/logger.js');
const { asyncErrorHandler } = require('./src/utils/errorHandling.js');
const TerminalManager = require('./src/services/TerminalManager.js');
const SettingsManager = require('./src/services/SettingsManager.js');
const PluginManager = require('./src/services/PluginManager.js');
const SecurityManager = require('./src/services/SecurityManager.js');
const PerformanceMonitor = require('./src/services/PerformanceMonitor.js');
const UpdateManager = require('./src/services/UpdateManager.js');

// Initialize services
const logger = new Logger('Main');
const terminalManager = new TerminalManager();
const settingsManager = new SettingsManager();
const pluginManager = new PluginManager();
const securityManager = new SecurityManager();
const performanceMonitor = new PerformanceMonitor();
let updateManager; // Will be initialized after settingsManager

let mainWindow;

// Configure security and performance switches
if (!APP_CONFIG.IS_DEVELOPMENT) {
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
  app.commandLine.appendSwitch('disable-logging');
  app.commandLine.appendSwitch('no-sandbox');
}

// Utility function for file size formatting
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Initialize application services
async function initializeServices() {
  try {
    logger.info('Initializing application services...');

    // Initialize security first
    securityManager.initialize();

    // Load settings
    await settingsManager.loadSettings();

    // Initialize update manager with settings
    updateManager = new UpdateManager(settingsManager);
    await updateManager.initialize();

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

// Dialog helpers for file operations
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  } catch (error) {
    throw new Error(`Failed to show open dialog: ${error.message}`);
  }
});

ipcMain.handle('show-input-dialog', async (event, options) => {
  const { title, message, defaultValue = '' } = options;

  // Since Electron doesn't have a built-in input dialog, we'll use a workaround
  return new Promise(resolve => {
    const result = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      title,
      message,
      detail: `Default: ${defaultValue}`,
      buttons: ['OK', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result === 0) {
      // For now, return the default value
      // In a real implementation, you'd want a proper input dialog
      resolve(defaultValue);
    } else {
      resolve(null);
    }
  });
});

async function createWindow() {
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
        preload: path.join(__dirname, APP_CONFIG.PATHS.PRELOAD),
        sandbox: false,
        webSecurity: true,
      },
      titleBarStyle: 'hiddenInset',
      title: APP_CONFIG.NAME,
      icon: path.join(__dirname, APP_CONFIG.PATHS.ICON),
      show: false, // Don't show until ready-to-show
    };

    mainWindow = new BrowserWindow(windowConfig);

    // Handle window events
    mainWindow.once('ready-to-show', () => {
      if (settings.window.maximized) {
        mainWindow.maximize();
      }
      mainWindow.show();

      // Focus on the window
      if (process.platform === 'darwin') {
        app.focus();
      }
    });

    // Save window state on close
    mainWindow.on('close', async () => {
      if (!mainWindow.isDestroyed()) {
        const bounds = mainWindow.getBounds();
        const isMaximized = mainWindow.isMaximized();

        await settingsManager.updateSettings({
          window: {
            ...settings.window,
            ...bounds,
            maximized: isMaximized,
          },
        });
      }
    });

    mainWindow.loadFile(APP_CONFIG.PATHS.TERMINAL_PAGE);

    // Open DevTools automatically in development
    if (APP_CONFIG.IS_DEVELOPMENT) {
      mainWindow.webContents.openDevTools();
      logger.info('Development mode detected - DevTools opened');
    }

    // Set up context menus
    setupContextMenus(mainWindow);

    // Execute window created hook
    await pluginManager.executeHook('windowCreated', { window: mainWindow });

    logger.info('Main window created successfully');
  } catch (error) {
    logger.error('Failed to create window', error);
    throw error;
  }
}
const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.argv.includes('--dev') ||
  process.argv.includes('--development');

// IPC handlers for navigation
ipcMain.handle(
  'navigate-to-page',
  asyncErrorHandler(async (event, page) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (page === AppStrings.navigation.terminal.name) {
        mainWindow.loadFile(AppStrings.navigation.terminal.path);

        // Ensure terminal process is ready after navigation
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            // Send a signal to renderer that page is ready
            mainWindow.webContents.send('terminal-page-ready');
          }
        }, 200);
      } else if (page === AppStrings.navigation.flutterCode.name) {
        mainWindow.loadFile(AppStrings.navigation.flutterCode.path);
      }
    }
  })
);

// IPC handlers for terminal communication using TerminalManager
ipcMain.handle(
  'create-terminal',
  asyncErrorHandler(async (event, options = {}) => {
    try {
      logger.info('Creating new terminal');
      performanceMonitor.incrementTerminalSessions();

      const result = terminalManager.createTerminal(options);
      const terminal = terminalManager.getTerminal(result.id);

      // Set up data handler
      terminal.process.onData(data => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-data', {
            terminalId: result.id,
            data,
          });
        }
      });

      // Handle terminal exit
      terminal.process.onExit((code, signal) => {
        logger.info(`Terminal ${result.id} exited`, { code, signal });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-exit', {
            terminalId: result.id,
            code,
            signal,
          });
        }
      });

      // Execute terminal created hook
      await pluginManager.executeHook('terminalCreated', {
        terminalId: result.id,
        terminal: terminal,
      });

      logger.info(`Terminal ${result.id} created successfully`);
      return result;
    } catch (error) {
      logger.error('Failed to create terminal', error);
      throw error;
    }
  })
);

ipcMain.handle(
  'write-to-terminal',
  asyncErrorHandler(async (event, terminalId, data) => {
    try {
      terminalManager.writeToTerminal(terminalId, data);
      performanceMonitor.incrementCommandCount();
    } catch (error) {
      logger.error('Failed to write to terminal', error);
      throw error;
    }
  })
);

ipcMain.handle(
  'send-command',
  asyncErrorHandler(async (event, terminalId, command) => {
    try {
      // If terminalId is null, use the active terminal
      const targetTerminalId = terminalId || terminalManager.activeTerminalId;

      if (!targetTerminalId) {
        throw new Error('No active terminal available');
      }

      terminalManager.sendCommand(targetTerminalId, command);
      performanceMonitor.incrementCommandCount();

      // Execute command sent hook
      await pluginManager.executeHook('commandSent', {
        terminalId: targetTerminalId,
        command,
      });

      logger.info(`Command sent to terminal ${targetTerminalId}: ${command}`);
    } catch (error) {
      logger.error('Failed to send command', error);
      throw error;
    }
  })
);

ipcMain.handle(
  'resize-terminal',
  asyncErrorHandler(async (event, terminalId, cols, rows) => {
    try {
      terminalManager.resizeTerminal(terminalId, cols, rows);
      logger.info(`Terminal ${terminalId} resized to ${cols}x${rows}`);
    } catch (error) {
      logger.error('Failed to resize terminal', error);
      throw error;
    }
  })
);

ipcMain.handle(
  'kill-terminal',
  asyncErrorHandler(async (event, terminalId) => {
    try {
      terminalManager.killTerminal(terminalId);

      // Execute terminal killed hook
      await pluginManager.executeHook('terminalKilled', { terminalId });

      logger.info(`Terminal ${terminalId} killed`);
    } catch (error) {
      logger.error('Failed to kill terminal', error);
      throw error;
    }
  })
);

// Check terminal status
ipcMain.handle(
  'check-terminal-status',
  asyncErrorHandler(async (event, terminalId) => {
    try {
      if (terminalId) {
        return terminalManager.getTerminalStatus(terminalId);
      } else {
        return terminalManager.getAllTerminalsStatus();
      }
    } catch (error) {
      logger.error('Failed to check terminal status', error);
      throw error;
    }
  })
);
// Execute command handler for GitHub CLI
ipcMain.handle(
  'execute-command',
  asyncErrorHandler(async (event, command, cwd = process.cwd()) => {
    return new Promise(resolve => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        performanceMonitor.incrementCommandCount();
        resolve({
          output: stdout,
          error: error ? stderr || error.message : null,
          success: !error,
        });
      });
    });
  })
);

// Get current working directory
ipcMain.handle('get-current-directory', () => {
  return process.cwd();
});

// Settings IPC handlers
ipcMain.handle(
  'get-settings',
  asyncErrorHandler(async () => {
    return settingsManager.getSettings();
  })
);

ipcMain.handle(
  'get-setting',
  asyncErrorHandler(async (event, key, defaultValue) => {
    return settingsManager.getSetting(key, defaultValue);
  })
);

ipcMain.handle(
  'set-setting',
  asyncErrorHandler(async (event, key, value) => {
    await settingsManager.setSetting(key, value);
    return true;
  })
);

ipcMain.handle(
  'update-settings',
  asyncErrorHandler(async (event, newSettings) => {
    await settingsManager.updateSettings(newSettings);
    return true;
  })
);

ipcMain.handle(
  'reset-settings',
  asyncErrorHandler(async (event, section) => {
    if (section) {
      await settingsManager.resetSection(section);
    } else {
      await settingsManager.resetSettings();
    }
    return true;
  })
);

// Performance monitoring IPC handlers
ipcMain.handle('get-performance-report', () => {
  return performanceMonitor.getPerformanceReport();
});

ipcMain.handle('get-performance-history', (event, type, limit) => {
  return performanceMonitor.getHistoricalData(type, limit);
});

// Plugin management IPC handlers
ipcMain.handle('get-plugins', () => {
  return pluginManager.getPlugins();
});

ipcMain.handle(
  'enable-plugin',
  asyncErrorHandler(async (event, pluginId) => {
    await pluginManager.enablePlugin(pluginId);
    return true;
  })
);

ipcMain.handle(
  'disable-plugin',
  asyncErrorHandler(async (event, pluginId) => {
    await pluginManager.disablePlugin(pluginId);
    return true;
  })
);

ipcMain.handle(
  'install-plugin',
  asyncErrorHandler(async (event, sourcePath) => {
    return await pluginManager.installPlugin(sourcePath);
  })
);

ipcMain.handle(
  'uninstall-plugin',
  asyncErrorHandler(async (event, pluginId) => {
    await pluginManager.uninstallPlugin(pluginId);
    return true;
  })
);

// Update management IPC handlers
ipcMain.handle(
  'check-for-updates',
  asyncErrorHandler(async (event, showDialog = true) => {
    await updateManager.checkForUpdates(showDialog);
    return true;
  })
);

ipcMain.handle('get-update-status', () => {
  return updateManager.getUpdateStatus();
});

ipcMain.handle(
  'set-auto-updates',
  asyncErrorHandler(async (event, enabled) => {
    await updateManager.setAutoUpdates(enabled);
    return true;
  })
);

// Security IPC handlers
ipcMain.handle('get-security-report', () => {
  return securityManager.getSecurityReport();
});

ipcMain.handle('add-trusted-host', (event, hostname) => {
  securityManager.addTrustedHost(hostname);
  return true;
});

ipcMain.handle('remove-trusted-host', (event, hostname) => {
  securityManager.removeTrustedHost(hostname);
  return true;
});

// Development-specific IPC handlers
ipcMain.handle('open-dev-tools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.openDevTools();
    return true;
  }
  return false;
});

ipcMain.handle('close-dev-tools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.closeDevTools();
    return true;
  }
  return false;
});

ipcMain.handle('toggle-dev-tools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.toggleDevTools();
    return true;
  }
  return false;
});

ipcMain.handle('reload-app', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.reload();
    return true;
  }
  return false;
});

ipcMain.handle('get-app-info', () => {
  return {
    isDevelopment:
      process.env.NODE_ENV === 'development' ||
      process.argv.includes('--dev') ||
      process.argv.includes('--development'),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

// File operation IPC handlers
ipcMain.handle('list-files', async (event, directoryPath = process.cwd()) => {
  try {
    const files = fs.readdirSync(directoryPath);
    return files.map(file => {
      const fullPath = path.join(directoryPath, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
      };
    });
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      modified: stats.mtime,
      created: stats.birthtime,
      accessed: stats.atime,
      permissions: stats.mode,
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
});

ipcMain.handle('create-file', async (event, filePath, content = '') => {
  try {
    fs.writeFileSync(filePath, content);
    return { success: true, path: filePath };
  } catch (error) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
});

ipcMain.handle('read-file-content', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content, path: filePath };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('write-file-content', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content);
    return { success: true, path: filePath };
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true, path: itemPath };
  } catch (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }
});

ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return { success: true, oldPath, newPath };
  } catch (error) {
    throw new Error(`Failed to rename item: ${error.message}`);
  }
});

ipcMain.handle('copy-item', async (event, sourcePath, destPath) => {
  try {
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
    return { success: true, sourcePath, destPath };
  } catch (error) {
    throw new Error(`Failed to copy item: ${error.message}`);
  }
});

// File tree generation with depth control
ipcMain.handle(
  'get-file-tree',
  async (event, rootPath = process.cwd(), maxDepth = 3) => {
    function buildTree(currentPath, currentDepth = 0) {
      if (currentDepth >= maxDepth) return null;

      try {
        const stats = fs.statSync(currentPath);
        const name = path.basename(currentPath);

        if (stats.isDirectory()) {
          const children = [];
          try {
            const items = fs.readdirSync(currentPath);
            for (const item of items) {
              // Skip hidden files/folders
              if (item.startsWith('.')) continue;

              const childPath = path.join(currentPath, item);
              const child = buildTree(childPath, currentDepth + 1);
              if (child) children.push(child);
            }
          } catch (error) {
            // Permission denied or other errors
          }

          return {
            name,
            path: currentPath,
            type: 'directory',
            children: children.sort((a, b) => {
              // Directories first, then files
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            }),
          };
        } else {
          return {
            name,
            path: currentPath,
            type: 'file',
            size: stats.size,
            extension: path.extname(currentPath),
          };
        }
      } catch (error) {
        return null;
      }
    }

    return buildTree(rootPath);
  }
);

// Advanced file search
ipcMain.handle('search-files', async (event, searchOptions) => {
  const {
    directory = process.cwd(),
    fileName = '',
    content = '',
    extensions = [],
    maxResults = 100,
  } = searchOptions;

  const results = [];

  function searchInDirectory(dir, depth = 0) {
    if (depth > 10 || results.length >= maxResults) return; // Prevent infinite recursion

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        if (results.length >= maxResults) break;
        if (item.startsWith('.')) continue; // Skip hidden files

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          searchInDirectory(fullPath, depth + 1);
        } else {
          let matches = true;

          // File name search
          if (
            fileName &&
            !item.toLowerCase().includes(fileName.toLowerCase())
          ) {
            matches = false;
          }

          // Extension filter
          if (
            extensions.length > 0 &&
            !extensions.includes(path.extname(item))
          ) {
            matches = false;
          }

          // Content search (for text files)
          if (content && matches) {
            try {
              const fileContent = fs.readFileSync(fullPath, 'utf8');
              if (!fileContent.toLowerCase().includes(content.toLowerCase())) {
                matches = false;
              }
            } catch (error) {
              // Binary file or permission error
              matches = false;
            }
          }

          if (matches) {
            results.push({
              name: item,
              path: fullPath,
              directory: dir,
              size: stats.size,
              modified: stats.mtime,
            });
          }
        }
      }
    } catch (error) {
      // Permission denied or other errors
    }
  }

  searchInDirectory(directory);
  return results;
});

// Recent files tracking
let recentFiles = [];
const MAX_RECENT_FILES = 20;

ipcMain.handle('add-recent-file', async (event, filePath) => {
  recentFiles = recentFiles.filter(file => file.path !== filePath);
  recentFiles.unshift({
    path: filePath,
    name: path.basename(filePath),
    timestamp: new Date().toISOString(),
  });

  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }

  return recentFiles;
});

ipcMain.handle('get-recent-files', async () => {
  return recentFiles.filter(file => {
    try {
      return fs.existsSync(file.path);
    } catch {
      return false;
    }
  });
});

// File statistics
ipcMain.handle(
  'get-file-stats',
  async (event, directoryPath = process.cwd()) => {
    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    const extensionCounts = {};

    function analyzeDirectory(dir, depth = 0) {
      if (depth > 5) return; // Prevent too deep recursion

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          if (item.startsWith('.')) continue;

          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            totalDirectories++;
            analyzeDirectory(fullPath, depth + 1);
          } else {
            totalFiles++;
            totalSize += stats.size;

            const ext = path.extname(item) || 'no extension';
            extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
          }
        }
      } catch (error) {
        // Permission denied or other errors
      }
    }

    analyzeDirectory(directoryPath);

    return {
      totalFiles,
      totalDirectories,
      totalSize,
      extensionCounts,
      formattedSize: formatBytes(totalSize),
    };
  }
);

// Utility function for file size formatting
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// App lifecycle events
app.whenReady().then(async () => {
  try {
    logger.info('App is ready, initializing...');

    // Initialize all services first
    await initializeServices();

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
    await createWindow();

    // Create the application menu (after window creation so mainWindow is available)
    createApplicationMenu(mainWindow, updateManager);

    logger.info('Application initialized successfully');

    // Execute app ready hook
    await pluginManager.executeHook('appReady', {
      mainWindow,
      app,
      version: app.getVersion(),
    });
  } catch (error) {
    logger.error('Failed to initialize application', error);

    // Show error dialog and quit
    const { dialog } = require('electron');
    await dialog.showErrorBox(
      'Initialization Error',
      `Failed to start ${APP_CONFIG.NAME}:\n\n${error.message}`
    );
    app.quit();
  }

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  try {
    logger.info('All windows closed, cleaning up...');

    // Cleanup services
    terminalManager.cleanup();
    await pluginManager.cleanup();
    performanceMonitor.cleanup();
    updateManager.cleanup();

    // Execute app closing hook
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
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

// Handle app quit
app.on('before-quit', async event => {
  try {
    // Execute before quit hook
    await pluginManager.executeHook('beforeQuit');

    // Save settings one final time
    await settingsManager.saveSettings();

    logger.info('Application shutting down gracefully');
  } catch (error) {
    logger.error('Error during shutdown', error);
  }
});
