const { ipcMain } = require('electron');
const { exec } = require('child_process');

module.exports = function setupCommandsIpcHandlers() {
  ipcMain.handle('execute-command', async (event, command, cwd) => {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout = '', stderr = '') => {
        // Always return strings for stdout and stderr
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stdout: stdout || '',
            stderr: stderr || '',
          });
        } else {
          resolve({
            success: true,
            stdout: stdout || '',
            stderr: stderr || '',
          });
        }
      });
    });
  });
};
