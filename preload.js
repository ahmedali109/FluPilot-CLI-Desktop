const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigateToPage: page => ipcRenderer.invoke('navigate-to-page', page),

  // Terminal functions
  createTerminal: () => ipcRenderer.invoke('create-terminal'),
  writeToTerminal: data => ipcRenderer.invoke('write-to-terminal', data),
  sendCommand: command => {
    // Legacy method - automatically uses active terminal
    // For new code, use sendCommandToTerminal with explicit terminalId
    return ipcRenderer.invoke('send-command', null, command);
  },
  resizeTerminal: (cols, rows) =>
    ipcRenderer.invoke('resize-terminal', cols, rows),
  killTerminal: () => ipcRenderer.invoke('kill-terminal'),
  checkTerminalStatus: () => ipcRenderer.invoke('check-terminal-status'),

  // Execute command for GitHub CLI
  executeCommand: (command, cwd) =>
    ipcRenderer.invoke('execute-command', command, cwd),

  // Directory operations
  getCurrentDirectory: () => ipcRenderer.invoke('get-current-directory'),

  // Listen for terminal data
  onTerminalData: callback => {
    ipcRenderer.on('terminal-data', (event, data) => callback(data));
  },

  // Listen for terminal exit
  onTerminalExit: callback => {
    ipcRenderer.on('terminal-exit', (event, data) => callback(data));
  },

  // Listen for terminal page ready signal
  onTerminalPageReady: callback => {
    ipcRenderer.on('terminal-page-ready', callback);
  },

  // Listen for open settings message from menu
  onOpenSettings: callback => {
    ipcRenderer.on('open-settings', callback);
  },

  // File operation listeners (from File menu)
  onFileOpened: callback => {
    ipcRenderer.on('file-opened', (event, data) => callback(data));
  },

  onFolderOpened: callback => {
    ipcRenderer.on('folder-opened', (event, data) => callback(data));
  },

  // Terminal operation listeners (from Terminal menu)
  onClearTerminal: callback => {
    ipcRenderer.on('clear-terminal', callback);
  },

  onCreateNewTerminal: callback => {
    ipcRenderer.on('create-new-terminal', callback);
  },

  onKillTerminal: callback => {
    ipcRenderer.on('kill-terminal', callback);
  },

  onCopyTerminalOutput: callback => {
    ipcRenderer.on('copy-terminal-output', callback);
  },

  onPasteTerminalOutput: callback => {
    ipcRenderer.on('paste-terminal-output', callback);
  },

  // View menu listeners
  onNavigateToTerminal: callback => {
    ipcRenderer.on('navigate-to-terminal', callback);
  },

  onNavigateToUIkit: callback => {
    ipcRenderer.on('navigate-to-ui-kit', callback);
  },

  // Tools menu listeners
  onRunGitCommand: callback => {
    ipcRenderer.on('run-git-command', (event, command) => callback(command));
  },

  onRunFlutterCommand: callback => {
    ipcRenderer.on('run-flutter-command', (event, command) =>
      callback(command)
    );
  },

  // Development tools
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  closeDevTools: () => ipcRenderer.invoke('close-dev-tools'),
  toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools'),
  reload: () => ipcRenderer.invoke('reload-app'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // File operations for AddCodeToWorkSpaceIDE functionality
  showOpenDialog: options => ipcRenderer.invoke('show-open-dialog', options),
  createFile: (filePath, content) =>
    ipcRenderer.invoke('create-file', filePath, content),
  writeFileContent: (filePath, content) =>
    ipcRenderer.invoke('write-file-content', filePath, content),
  addRecentFile: filePath => ipcRenderer.invoke('add-recent-file', filePath),

  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getSetting: (key, defaultValue) =>
    ipcRenderer.invoke('get-setting', key, defaultValue),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  updateSettings: settings => ipcRenderer.invoke('update-settings', settings),
  resetSettings: section => ipcRenderer.invoke('reset-settings', section),

  // Performance monitoring
  getPerformanceReport: () => ipcRenderer.invoke('get-performance-report'),
  getPerformanceHistory: (type, limit) =>
    ipcRenderer.invoke('get-performance-history', type, limit),

  // Plugin management
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
  enablePlugin: pluginId => ipcRenderer.invoke('enable-plugin', pluginId),
  disablePlugin: pluginId => ipcRenderer.invoke('disable-plugin', pluginId),
  installPlugin: sourcePath => ipcRenderer.invoke('install-plugin', sourcePath),
  uninstallPlugin: pluginId => ipcRenderer.invoke('uninstall-plugin', pluginId),

  // Update management
  checkForUpdates: showDialog =>
    ipcRenderer.invoke('check-for-updates', showDialog),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  setAutoUpdates: enabled => ipcRenderer.invoke('set-auto-updates', enabled),

  // Security
  getSecurityReport: () => ipcRenderer.invoke('get-security-report'),
  addTrustedHost: hostname => ipcRenderer.invoke('add-trusted-host', hostname),
  removeTrustedHost: hostname =>
    ipcRenderer.invoke('remove-trusted-host', hostname),

  // Enhanced terminal methods with terminal ID support
  createTerminalWithOptions: options =>
    ipcRenderer.invoke('create-terminal', options),
  writeToTerminalById: (terminalId, data) =>
    ipcRenderer.invoke('write-to-terminal', terminalId, data),
  sendCommandToTerminal: (terminalId, command) =>
    ipcRenderer.invoke('send-command', terminalId, command),
  resizeTerminalById: (terminalId, cols, rows) =>
    ipcRenderer.invoke('resize-terminal', terminalId, cols, rows),
  killTerminalById: terminalId =>
    ipcRenderer.invoke('kill-terminal', terminalId),
  checkTerminalStatusById: terminalId =>
    ipcRenderer.invoke('check-terminal-status', terminalId),

  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('terminal-data');
    ipcRenderer.removeAllListeners('terminal-exit');
    ipcRenderer.removeAllListeners('terminal-page-ready');
    ipcRenderer.removeAllListeners('open-settings');
    ipcRenderer.removeAllListeners('file-opened');
    ipcRenderer.removeAllListeners('folder-opened');
    ipcRenderer.removeAllListeners('clear-terminal');
    ipcRenderer.removeAllListeners('create-new-terminal');
    ipcRenderer.removeAllListeners('kill-terminal');
    ipcRenderer.removeAllListeners('copy-terminal-output');
    ipcRenderer.removeAllListeners('paste-terminal-output');
    ipcRenderer.removeAllListeners('navigate-to-terminal');
    ipcRenderer.removeAllListeners('navigate-to-ui-kit');
    ipcRenderer.removeAllListeners('run-git-command');
    ipcRenderer.removeAllListeners('run-flutter-command');
  },
});
