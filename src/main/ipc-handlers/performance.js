// IPC handlers for performance monitoring
module.exports = function setupPerformanceIpcHandlers({
  ipcMain,
  performanceMonitor,
}) {
  ipcMain.handle('get-performance-report', () =>
    performanceMonitor.getPerformanceReport()
  );
  ipcMain.handle('get-performance-history', (event, type, limit) =>
    performanceMonitor.getHistoricalData(type, limit)
  );
};
