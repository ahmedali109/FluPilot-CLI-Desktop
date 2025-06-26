const { app, ipcMain } = require('electron');

module.exports = function setupAppIpcHandlers() {
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      path: app.getAppPath(),
      platform: process.platform,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      date: new Date().toISOString(),
    };
  });

  ipcMain.handle('reload-app', event => {
    const win = event.sender && event.sender.getOwnerBrowserWindow();
    if (win) win.reload();
    return { success: true };
  });
};
