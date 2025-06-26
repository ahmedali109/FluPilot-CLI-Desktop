// IPC handlers for terminal management
module.exports = function setupTerminalIpcHandlers({
  ipcMain,
  terminalManager,
  performanceMonitor,
  pluginManager,
  logger,
  getMainWindow,
}) {
  const { asyncErrorHandler } = require('../../utils/errorHandling.js');

  ipcMain.handle(
    'create-terminal',
    asyncErrorHandler(async (event, options = {}) => {
      logger.info('Creating new terminal');
      performanceMonitor.incrementTerminalSessions();
      const result = terminalManager.createTerminal(options);
      const terminal = terminalManager.getTerminal(result.id);
      terminal.process.onData(data => {
        const mainWindow = getMainWindow && getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-data', {
            terminalId: result.id,
            data,
          });
        }
      });
      terminal.process.onExit((code, signal) => {
        const mainWindow = getMainWindow && getMainWindow();
        logger.info(`Terminal ${result.id} exited`, { code, signal });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-exit', {
            terminalId: result.id,
            code,
            signal,
          });
        }
      });
      await pluginManager.executeHook('terminalCreated', {
        terminalId: result.id,
        terminal: terminal,
      });
      logger.info(`Terminal ${result.id} created successfully`);
      return result;
    })
  );

  ipcMain.handle(
    'write-to-terminal',
    asyncErrorHandler(async (event, terminalId, data) => {
      terminalManager.writeToTerminal(terminalId, data);
      performanceMonitor.incrementCommandCount();
    })
  );

  ipcMain.handle(
    'send-command',
    asyncErrorHandler(async (event, terminalId, command) => {
      const targetTerminalId = terminalId || terminalManager.activeTerminalId;
      if (!targetTerminalId) throw new Error('No active terminal available');
      terminalManager.sendCommand(targetTerminalId, command);
      performanceMonitor.incrementCommandCount();
      await pluginManager.executeHook('commandSent', {
        terminalId: targetTerminalId,
        command,
      });
      logger.info(`Command sent to terminal ${targetTerminalId}: ${command}`);
    })
  );

  ipcMain.handle(
    'resize-terminal',
    asyncErrorHandler(async (event, terminalId, cols, rows) => {
      terminalManager.resizeTerminal(terminalId, cols, rows);
      logger.info(`Terminal ${terminalId} resized to ${cols}x${rows}`);
    })
  );

  ipcMain.handle(
    'kill-terminal',
    asyncErrorHandler(async (event, terminalId) => {
      terminalManager.killTerminal(terminalId);
      await pluginManager.executeHook('terminalKilled', { terminalId });
      logger.info(`Terminal ${terminalId} killed`);
    })
  );

  ipcMain.handle(
    'check-terminal-status',
    asyncErrorHandler(async (event, terminalId) => {
      if (terminalId) {
        return terminalManager.getTerminalStatus(terminalId);
      } else {
        return terminalManager.getAllTerminalsStatus();
      }
    })
  );
};
