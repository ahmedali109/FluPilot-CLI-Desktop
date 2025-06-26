// IPC handlers for file operations
const path = require('path');
const fs = require('fs');
const formatBytes = require('../../utils/formatBytes');

module.exports = function setupFileIpcHandlers({ ipcMain }) {
  ipcMain.handle('list-files', async (event, directoryPath = process.cwd()) => {
    try {
      const files = fs.readdirSync(directoryPath);
      return files.map(file => {
        const fullPath = path.join(directoryPath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
        };
      });
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  });

  ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        modified: stats.mtime,
        created: stats.birthtime,
        accessed: stats.atime,
        permissions: stats.mode,
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  });

  ipcMain.handle('create-file', async (event, filePath, content = '') => {
    try {
      fs.writeFileSync(filePath, content);
      return { success: true, path: filePath };
    } catch (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  });

  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true, path: dirPath };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  });

  ipcMain.handle('read-file-content', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { content, path: filePath };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  ipcMain.handle('write-file-content', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content);
      return { success: true, path: filePath };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  });

  ipcMain.handle('delete-item', async (event, itemPath) => {
    try {
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      return { success: true, path: itemPath };
    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  });

  ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
    try {
      fs.renameSync(oldPath, newPath);
      return { success: true, oldPath, newPath };
    } catch (error) {
      throw new Error(`Failed to rename item: ${error.message}`);
    }
  });

  ipcMain.handle('copy-item', async (event, sourcePath, destPath) => {
    try {
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
      return { success: true, sourcePath, destPath };
    } catch (error) {
      throw new Error(`Failed to copy item: ${error.message}`);
    }
  });

  // Additional handlers (file tree, search, stats, recent files) can be added here as needed
};
