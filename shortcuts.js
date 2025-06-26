// Global keyboard shortcuts for the Electron Terminal
document.addEventListener('keydown', function (event) {
  // Use Cmd on Mac, Ctrl on Windows/Linux
  const modifier = navigator.platform.includes('Mac')
    ? event.metaKey
    : event.ctrlKey;

  // Terminal Control Shortcuts
  if (modifier && event.key === 'l') {
    event.preventDefault();
    // Clear terminal
    const clearBtn = document.querySelector('[data-cmd="clear"]');
    if (clearBtn) clearBtn.click();
    return;
  }

  if (modifier && event.key === 'k') {
    event.preventDefault();
    // Clear terminal (alternative)
    if (typeof terminal !== 'undefined' && terminal) {
      terminal.clear();
    }
    return;
  }

  if (modifier && event.key === 'd') {
    event.preventDefault();
    // Exit/logout command
    if (typeof terminal !== 'undefined' && terminal) {
      terminal.write('exit\r');
    }
    return;
  }

  // Settings and UI Shortcuts
  if (modifier && event.key === ',') {
    event.preventDefault();
    // Open Settings (standard shortcut)
    const settingsBtn = document.getElementById('sidebar-settings-btn');
    if (settingsBtn) settingsBtn.click();
    return;
  }

  if (modifier && event.shiftKey && event.key === 'P') {
    event.preventDefault();
    // Open Settings (alternative)
    const settingsBtn = document.getElementById('sidebar-settings-btn');
    if (settingsBtn) settingsBtn.click();
    return;
  }

  // Quick Command Shortcuts
  if (modifier && event.key === 'o') {
    event.preventDefault();
    // List files
    const listFilesBtn = document.querySelector('[data-cmd="ls -la"]');
    if (listFilesBtn) listFilesBtn.click();
    return;
  }

  if (modifier && event.key === 'p') {
    event.preventDefault();
    // Show current directory
    const pwdBtn = document.querySelector('[data-cmd="pwd"]');
    if (pwdBtn) pwdBtn.click();
    return;
  }

  if (modifier && event.key === 'w') {
    event.preventDefault();
    // Show current user
    const whoamiBtn = document.querySelector('[data-cmd="whoami"]');
    if (whoamiBtn) whoamiBtn.click();
    return;
  }

  if (modifier && event.key === 't') {
    event.preventDefault();
    // Show date/time
    const dateBtn = document.querySelector('[data-cmd="date"]');
    if (dateBtn) dateBtn.click();
    return;
  }

  // Git Shortcuts
  if (modifier && event.shiftKey && event.key === 'G') {
    event.preventDefault();
    // Open Git commands dropdown
    const gitBtn = document.getElementById('git-commands');
    if (gitBtn) gitBtn.click();
    return;
  }

  if (modifier && event.key === 'g') {
    event.preventDefault();
    // Git status (quick command)
    if (typeof terminal !== 'undefined' && terminal) {
      terminal.write('git status\r');
    }
    return;
  }

  // FluPilot CLI Shortcuts
  if (modifier && event.shiftKey && event.key === 'F') {
    event.preventDefault();
    // Open FluPilot commands dropdown
    const flupilotBtn = document.getElementById('flupilot-commands');
    if (flupilotBtn) flupilotBtn.click();
    return;
  }

  // System Information Shortcuts
  if (modifier && event.key === 'i') {
    event.preventDefault();
    // System info
    const sysInfoBtn = document.querySelector('[data-cmd="uname -a"]');
    if (sysInfoBtn) sysInfoBtn.click();
    return;
  }

  if (modifier && event.shiftKey && event.key === 'D') {
    event.preventDefault();
    // Disk usage
    const diskUsageBtn = document.querySelector('[data-cmd="df -h"]');
    if (diskUsageBtn) diskUsageBtn.click();
    return;
  }

  if (modifier && event.shiftKey && event.key === 'R') {
    event.preventDefault();
    // Running processes
    const processesBtn = document.querySelector('[data-cmd="ps aux"]');
    if (processesBtn) processesBtn.click();
    return;
  }

  // Update Check Shortcut
  if (modifier && event.shiftKey && event.key === 'U') {
    event.preventDefault();
    // Check for updates
    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates(true);
    } else {
      console.warn('Update check not supported in this environment.');
    }
    return;
  }

  // Zoom Shortcuts
  if (modifier && event.key === '=') {
    event.preventDefault();
    // Zoom in
    if (typeof settingsManager !== 'undefined' && settingsManager) {
      const currentSize = settingsManager.currentSettings.fontSize;
      const newSize = Math.min(currentSize + 1, 24);
      settingsManager.currentSettings.fontSize = newSize;
      settingsManager.applyTerminalSettings();
    }
    return;
  }

  if (modifier && event.key === '-') {
    event.preventDefault();
    // Zoom out
    if (typeof settingsManager !== 'undefined' && settingsManager) {
      const currentSize = settingsManager.currentSettings.fontSize;
      const newSize = Math.max(currentSize - 1, 10);
      settingsManager.currentSettings.fontSize = newSize;
      settingsManager.applyTerminalSettings();
    }
    return;
  }

  if (modifier && event.key === '0') {
    event.preventDefault();
    // Reset zoom
    if (typeof settingsManager !== 'undefined' && settingsManager) {
      settingsManager.currentSettings.fontSize = 14;
      settingsManager.applyTerminalSettings();
    }
    return;
  }

  // Theme Shortcuts
  if (modifier && event.shiftKey && event.key === 'T') {
    event.preventDefault();
    // Cycle through themes
    if (typeof settingsManager !== 'undefined' && settingsManager) {
      const themes = [
        'dark',
        'light',
        'dracula',
        'monokai',
        'solarized-dark',
        'one-dark',
        'nord',
        'gruvbox-dark',
        'palenight',
        'tokyo-night',
        'catppuccin-mocha',
      ];
      const currentTheme = settingsManager.currentSettings.theme;
      const currentIndex = themes.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      settingsManager.currentSettings.theme = themes[nextIndex];
      settingsManager.applyTheme();
      settingsManager.showNotification(
        `Switched to ${themes[nextIndex]} theme`,
        'info'
      );
    }
    return;
  }

  // Help Shortcuts
  if (event.key === 'F1' || (modifier && event.key === '?')) {
    event.preventDefault();
    // Show help/shortcuts
    showShortcutsHelp();
    return;
  }

  // Window Controls (for development)
  if (modifier && event.key === 'r') {
    event.preventDefault();
    // Reload app
    if (window.electronAPI && window.electronAPI.reload) {
      window.electronAPI.reload();
    } else {
      window.location.reload();
    }
    return;
  }

  if (modifier && event.shiftKey && event.key === 'I') {
    event.preventDefault();
    // Open DevTools
    if (window.electronAPI && window.electronAPI.openDevTools) {
      window.electronAPI.openDevTools();
    }
    return;
  }

  // File Operations
  if (modifier && event.key === 'n') {
    event.preventDefault();
    // New terminal instance (if supported)
    if (window.electronAPI && window.electronAPI.newWindow) {
      window.electronAPI.newWindow();
    }
    return;
  }

  // Escape key handling
  if (event.key === 'Escape') {
    // Close any open modals or dropdowns
    const modal = document.getElementById('settings-modal');
    if (modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
      event.preventDefault();
      return;
    }

    const gitDropdown = document.getElementById('git-dropdown');
    if (gitDropdown && gitDropdown.classList.contains('show')) {
      gitDropdown.classList.remove('show');
      event.preventDefault();
      return;
    }

    const flupilotDropdown = document.getElementById('flupilot-dropdown');
    if (flupilotDropdown && flupilotDropdown.classList.contains('show')) {
      flupilotDropdown.classList.remove('show');
      event.preventDefault();
      return;
    }
  }
});

// Function to show shortcuts help
function showShortcutsHelp() {
  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? 'Cmd' : 'Ctrl';

  const shortcuts = `
🔥 KEYBOARD SHORTCUTS

📺 Navigation:
${mod} + 1          Switch to Terminal
${mod} + 2          Switch to flutterCode

🖥️ Terminal Control:
${mod} + L          Clear terminal
${mod} + K          Clear terminal (alt)
${mod} + D          Exit/logout

⚙️ Settings & UI:
${mod} + ,          Open Settings
${mod} + Shift + P  Open Settings (alt)
F1 / ${mod} + ?     Show this help

🔍 Quick Commands:
${mod} + O          List files (ls -la)
${mod} + P          Show directory (pwd)
${mod} + U          Show user (whoami)
${mod} + T          Show date/time
${mod} + I          System info

📊 Git & Tools:
${mod} + Shift + G  Git commands menu
${mod} + G          Git status
${mod} + Shift + F  FluPilot menu

📈 System Info:
${mod} + Shift + D  Disk usage
${mod} + Shift + R  Running processes

🔍 Zoom:
${mod} + =          Zoom in
${mod} + -          Zoom out
${mod} + 0          Reset zoom

🎨 Themes:
${mod} + Shift + T  Cycle themes

🛠️ Development:
${mod} + R          Reload app
${mod} + Shift + I  Open DevTools
${mod} + N          New window

🔚 General:
Escape             Close modals/dropdowns
  `;

  // Show in a modal or notification
  if (typeof settingsManager !== 'undefined' && settingsManager) {
    settingsManager.showNotification(
      'Shortcuts help logged to console',
      'info'
    );
  }
  // Also try to show in an alert as fallback
  alert(shortcuts.trim());
}

// Terminal focus shortcuts (when terminal is focused)
document.addEventListener('DOMContentLoaded', function () {
  const terminalElement = document.getElementById('terminal');
  if (terminalElement) {
    terminalElement.addEventListener('keydown', function (event) {
      // Ctrl+C handling (let terminal handle it naturally)
      if (event.ctrlKey && event.key === 'c') {
        // Let the terminal handle Ctrl+C naturally
        return;
      }

      // Ctrl+V for paste (if clipboard API is available)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard
            .readText()
            .then(text => {
              if (typeof terminal !== 'undefined' && terminal) {
                terminal.write(text);
              }
            })
            .catch(err => {
              console.warn('Could not read clipboard:', err);
            });
        }
        return;
      }
    });
  }
});
