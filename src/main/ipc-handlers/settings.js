// IPC handlers for settings management
module.exports = function setupSettingsIpcHandlers({
  ipcMain,
  settingsManager,
}) {
  const { asyncErrorHandler } = require('../../utils/errorHandling.js');

  ipcMain.handle(
    'get-settings',
    asyncErrorHandler(async () => settingsManager.getSettings())
  );

  ipcMain.handle(
    'get-setting',
    asyncErrorHandler(async (event, key, defaultValue) =>
      settingsManager.getSetting(key, defaultValue)
    )
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
};
