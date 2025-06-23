
// Application Menu IPC Handlers
if (window.electronAPI) {
  // Settings handler
  window.electronAPI.onOpenSettings(() => {
    if (settingsManager && settingsManager.openModal) {
      settingsManager.openModal();
      console.log('Settings opened from menu');
    }
  });

  // File operation handlers
  window.electronAPI.onFileOpened(data => {
    console.log('File opened from menu:', data.path);
    showNotification(`File opened: ${data.path}`, 'success');

    // Add to recent files if the function exists
    if (window.electronAPI.addRecentFile) {
      window.electronAPI.addRecentFile(data.path);
    }

    // You can add file content display logic here
    // For example, if you have a file viewer component:
    // displayFileContent(data.path, data.content);
  });

  window.electronAPI.onFolderOpened(data => {
    console.log('Folder opened from menu:', data.path);
    showNotification(`Working directory changed to: ${data.path}`, 'info');

    // Update the current working directory display if you have one
    // updateWorkingDirectoryDisplay(data.path);
  });

  // Terminal operation handlers
  window.electronAPI.onClearTerminal(() => {
    if (terminal) {
      terminal.clear();
      console.log('Terminal cleared from menu');
      showNotification('Terminal cleared', 'info');
    }
  });

  window.electronAPI.onCreateNewTerminal(async () => {
    try {
      await window.electronAPI.createTerminal();

      // Update status to connected after successful creation
      if (typeof updateStatus === 'function') {
        updateStatus(true);
      }

      // Focus the terminal
      if (terminal && terminal.focus) {
        terminal.focus();
      }

      console.log('New terminal created from menu and status updated to connected');
      showNotification('New terminal created', 'success');
    } catch (error) {
      console.error('Failed to create new terminal from menu:', error);

      // Update status to disconnected on failure
      if (typeof updateStatus === 'function') {
        updateStatus(false);
      }

      showNotification('Failed to create terminal', 'error');
    }
  });

  window.electronAPI.onKillTerminal(() => {
    if (window.electronAPI && window.electronAPI.killTerminal) {
      window.electronAPI.killTerminal();
      console.log('Terminal killed from menu');
      showNotification('Terminal process terminated', 'warning');
    }
  });

  window.electronAPI.onCopyTerminalOutput(() => {
    if (terminal) {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard
          .writeText(selection)
          .then(() => {
            console.log('Terminal selection copied to clipboard');
            showNotification(
              'Terminal selection copied to clipboard',
              'success'
            );
          })
          .catch(err => {
            console.error('Failed to copy selection:', err);
            showNotification('Failed to copy selection', 'error');
          });
      } else {
        // Get visible terminal content as fallback
        try {
          const buffer = terminal.buffer.active;
          let content = '';
          for (let i = 0; i < buffer.length; i++) {
            const line = buffer.getLine(i);
            if (line) {
              content += line.translateToString() + '\n';
            }
          }
          navigator.clipboard.writeText(content).then(() => {
            console.log('Terminal content copied to clipboard');
            showNotification('Terminal content copied to clipboard', 'success');
          });
        } catch (err) {
          console.error('Failed to copy terminal content:', err);
          showNotification('Failed to copy terminal content', 'error');
        }
      }
    }
  });

  window.electronAPI.onPasteTerminalOutput(() => {
    if (terminal) {
      navigator.clipboard
        .readText()
        .then(text => {
          if (window.electronAPI && window.electronAPI.writeToTerminal) {
            window.electronAPI.writeToTerminal(text);
            console.log('Text pasted to terminal');
            showNotification('Text pasted to terminal', 'success');
          }
        })
        .catch(err => {
          console.error('Failed to paste text:', err);
          showNotification('Failed to paste text', 'error');
        });
    }
  });

  // Navigation handlers
  window.electronAPI.onNavigateToTerminal(() => {
    if (window.electronAPI && window.electronAPI.navigateToPage) {
      window.electronAPI.navigateToPage('Terminal');
      console.log('Navigating to Terminal view');
    }
  });

  window.electronAPI.onNavigateToUIkit(() => {
    if (window.electronAPI && window.electronAPI.navigateToPage) {
      window.electronAPI.navigateToPage('Flutter Code Explorer');
      console.log('Navigating to UI Kit view');
    }
  });

  // Git and Flutter command handlers
  window.electronAPI.onRunGitCommand(command => {
    if (window.electronAPI && window.electronAPI.sendCommand) {
      window.electronAPI.sendCommand(command);
      console.log('Executing git command from menu:', command);
      showNotification(`Executing: ${command}`, 'info');
    }
  });

  window.electronAPI.onRunFlutterCommand(command => {
    if (window.electronAPI && window.electronAPI.sendCommand) {
      window.electronAPI.sendCommand(command);
      console.log('Executing flutter command from menu:', command);
      showNotification(`Executing: ${command}`, 'info');
    }
  });
}

// Utility function for showing notifications (if not already defined)
function showNotification(message, type = 'info') {
  // Check if notification function already exists
  if (
    typeof settingsManager !== 'undefined' &&
    settingsManager &&
    settingsManager.showNotification
  ) {
    settingsManager.showNotification(message, type);
    return;
  }

  // Create notification element if no existing notification system
  const notification = document.createElement('div');
  notification.className = `menu-notification menu-notification-${type}`;
  notification.textContent = message;

  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideInFromRight 0.3s ease;
  `;

  // Set background color based on type
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  // Add to DOM
  document.body.appendChild(notification);

  // Remove after delay
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for menu notifications if not already added
if (!document.getElementById('menu-notification-styles')) {
  const style = document.createElement('style');
  style.id = 'menu-notification-styles';
  style.textContent = `
    @keyframes slideInFromRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutToRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
