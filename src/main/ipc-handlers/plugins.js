// IPC handlers for plugin management
module.exports = function setupPluginIpcHandlers({ ipcMain, pluginManager }) {
  const { asyncErrorHandler } = require('../../utils/errorHandling.js');

  ipcMain.handle('get-plugins', () => pluginManager.getPlugins());

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
    asyncErrorHandler(async (event, sourcePath) =>
      pluginManager.installPlugin(sourcePath)
    )
  );

  ipcMain.handle(
    'uninstall-plugin',
    asyncErrorHandler(async (event, pluginId) => {
      await pluginManager.uninstallPlugin(pluginId);
      return true;
    })
  );
};
