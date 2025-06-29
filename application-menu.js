const { app, Menu, dialog, shell } = require('electron');
const { AppStrings } = require('./appStrings.cjs');
const fs = require('fs');
const path = require('path');

// Create native application menu
function createApplicationMenu(mainWindow, updateManager = null) {
  const isMac = process.platform === AppStrings.os.mac;

  const template = [
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              {
                label: `About ${AppStrings.appName}`,
                role: 'about',
              },
              { type: 'separator' },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => {
                  // Send IPC message to renderer to open settings
                  mainWindow.webContents.send('open-settings');
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Open File',
              properties: ['openFile'],
              filters: [
                {
                  name: 'Text Files',
                  extensions: ['txt', 'md', 'json', 'js', 'ts', 'html', 'css'],
                },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                mainWindow.webContents.send('file-opened', {
                  path: filePath,
                  content,
                });
              } catch (error) {
                dialog.showErrorBox(
                  'Error',
                  `Failed to open file: ${error.message}`
                );
              }
            }
          },
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Open Folder',
              properties: ['openDirectory'],
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const folderPath = result.filePaths[0];
              process.chdir(folderPath);
              mainWindow.webContents.send('folder-opened', {
                path: folderPath,
              });
            }
          },
        },
        ...(isMac ? [] : [{ role: 'quit' }]),
      ],
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Clear Terminal',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('clear-terminal');
          },
        },
      ],
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Terminal',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate-to-terminal');
          },
        },
        {
          label: 'UI Kit Library',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate-to-ui-kit');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Terminal Menu
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('create-new-terminal');
          },
        },
        {
          label: 'Kill Terminal',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => {
            mainWindow.webContents.send('kill-terminal');
          },
        },
        { type: 'separator' },
        {
          label: 'Clear Terminal',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('clear-terminal');
          },
        },
        { type: 'separator' },
        {
          label: 'Copy Terminal Output',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow.webContents.send('copy-terminal-output');
          },
        },
        {
          label: 'Paste Terminal Output',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => {
            mainWindow.webContents.send('paste-terminal-output');
          },
        },
      ],
    },

    // Tools Menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'GitHub Commands',
          submenu: [
            {
              label: 'Git Status',
              click: () => {
                mainWindow.webContents.send('run-git-command', 'git status');
              },
            },
            {
              label: 'Git Log',
              click: () => {
                mainWindow.webContents.send(
                  'run-git-command',
                  'git log --oneline -10'
                );
              },
            },
          ],
        },
        {
          label: 'Flutter Commands',
          submenu: [
            {
              label: 'Flutter Doctor',
              click: () => {
                mainWindow.webContents.send(
                  'run-flutter-command',
                  'flutter doctor'
                );
              },
            },
            {
              label: 'Flutter Clean',
              click: () => {
                mainWindow.webContents.send(
                  'run-flutter-command',
                  'flutter clean'
                );
              },
            },
            {
              label: 'Flutter Pub Get',
              click: () => {
                mainWindow.webContents.send(
                  'run-flutter-command',
                  'flutter pub get'
                );
              },
            },
          ],
        },
      ],
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : []),
      ],
    },

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About FluPilot CLI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About FluPilot CLI',
              message: AppStrings.appName,
              detail: `Version: ${AppStrings.appVersion}\n${AppStrings.appCopyright}\n\n${AppStrings.appCredits}`,
              icon: path.join(__dirname, AppStrings.appIcon),
            });
          },
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            showKeyboardShortcuts(mainWindow);
          },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: async () => {
            await handleCheckForUpdates(mainWindow, updateManager);
          },
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal(
              'https://github.com/ahmedali109/FluPilot-CLI-Desktop/issues'
            );
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Set up context menus
function setupContextMenus(mainWindow) {
  if (!mainWindow) return;

  // Context menu for terminal area
  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        enabled: params.selectionText.length > 0,
        click: () => {
          mainWindow.webContents.copy();
        },
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        click: () => {
          mainWindow.webContents.paste();
        },
      },
      { type: 'separator' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: () => {
          mainWindow.webContents.selectAll();
        },
      },
      { type: 'separator' },
      {
        label: 'Clear Terminal',
        click: () => {
          mainWindow.webContents.send('clear-terminal');
        },
      },
      {
        label: 'New Terminal',
        click: () => {
          mainWindow.webContents.send('create-new-terminal');
        },
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        },
      },
    ]);

    contextMenu.popup({ window: mainWindow });
  });
}

// Show keyboard shortcuts
function showKeyboardShortcuts(mainWindow) {
  const shortcuts = `
Keyboard Shortcuts:

File Operations:
• Cmd/Ctrl + N - New File
• Cmd/Ctrl + Shift + N - New Folder
• Cmd/Ctrl + O - Open File
• Cmd/Ctrl + Shift + O - Open Folder
• Cmd/Ctrl + S - Save File
• Cmd/Ctrl + Shift + S - Save As

Terminal:
• Cmd/Ctrl + T - New Terminal
• Cmd/Ctrl + K - Clear Terminal
• Cmd/Ctrl + Shift + K - Kill Terminal
• Cmd/Ctrl + Shift + C - Copy Terminal Output

Navigation:
• Cmd/Ctrl + 1 - Terminal View
• Cmd/Ctrl + 2 - Flutter Code View
• Cmd/Ctrl + E - Toggle File Explorer

Search:
• Cmd/Ctrl + F - Find
• Cmd/Ctrl + Shift + F - Find in Files

View:
• F5 - Refresh File List
• Cmd/Ctrl + R - Reload
• Cmd/Ctrl + Shift + R - Force Reload
• Cmd/Ctrl + Plus - Zoom In
• Cmd/Ctrl + Minus - Zoom Out
• Cmd/Ctrl + 0 - Reset Zoom

Application:
• Cmd/Ctrl + Shift + U - Check for Updates
  `;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Keyboard Shortcuts',
    message: 'FluPilot CLI Shortcuts',
    detail: shortcuts,
    buttons: ['OK'],
  });
}

// Handle check for updates from menu
async function handleCheckForUpdates(mainWindow, updateManager) {
  if (!updateManager) {
    // Fallback if updateManager is not available
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: 'Update service is not available',
      detail:
        'The update manager is not initialized. Please restart the application and try again.',
      buttons: ['OK'],
    });
    return;
  }

  try {
    // // Show checking dialog
    // const checkingDialog = dialog.showMessageBox(mainWindow, {
    //   type: 'info',
    //   title: 'Checking for Updates',
    //   message: 'Checking for updates...',
    //   detail: 'Please wait while we check for the latest version.',
    //   buttons: ['Cancel'],
    // });

    // Get current update status
    const updateStatus = updateManager.getUpdateStatus();

    if (updateStatus.isChecking) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Check in Progress',
        message: 'Update check is already in progress',
        detail: 'Please wait for the current update check to complete.',
        buttons: ['OK'],
      });
      return;
    }

    // Perform the update check with UI dialog
    await updateManager.checkForUpdates(true);

    // Get the updated status after check
    const finalStatus = updateManager.getUpdateStatus();

  } catch (error) {
    // Show error dialog
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: 'Failed to check for updates',
      detail: `Error: ${error.message}\n\nPlease check your internet connection and try again later.`,
      buttons: ['OK'],
    });
  }
}

module.exports = { createApplicationMenu, setupContextMenus };
