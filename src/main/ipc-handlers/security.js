// IPC handlers for security management
module.exports = function setupSecurityIpcHandlers({
  ipcMain,
  securityManager,
}) {
  ipcMain.handle('get-security-report', () =>
    securityManager.getSecurityReport()
  );
  ipcMain.handle('add-trusted-host', (event, hostname) => {
    securityManager.addTrustedHost(hostname);
    return true;
  });
  ipcMain.handle('remove-trusted-host', (event, hostname) => {
    securityManager.removeTrustedHost(hostname);
    return true;
  });
};
