// IPC handlers for update management
module.exports = function setupUpdateIpcHandlers({ ipcMain, updateManager }) {
  const { asyncErrorHandler } = require('../../utils/errorHandling.js');

  ipcMain.handle(
    'check-for-updates',
    asyncErrorHandler(async (event, showDialog = true) => {
      await updateManager.checkForUpdates(showDialog);
      return true;
    })
  );

  ipcMain.handle('get-update-status', () => updateManager.getUpdateStatus());

  ipcMain.handle(
    'set-auto-updates',
    asyncErrorHandler(async (event, enabled) => {
      await updateManager.setAutoUpdates(enabled);
      return true;
    })
  );
};
