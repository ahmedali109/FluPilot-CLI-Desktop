class RendererTerminalManager {
  constructor() {
    this.terminals = new Map();
    this.activeTerminalId = null;
    this.settings = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Load settings
      this.settings = await window.electronAPI.getSettings();

      // Initialize with settings
      await this.applySettings();

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error;
    }
  }

  async applySettings() {
    const terminalSettings = this.settings?.terminal || {};

    // Update default terminal configuration
    this.defaultTerminalConfig = {
      cursorBlink: terminalSettings.cursorBlink ?? true,
      cursorStyle: terminalSettings.cursorStyle || 'block',
      fontFamily:
        terminalSettings.fontFamily ||
        '"Menlo", "Monaco", "Courier New", monospace',
      fontSize: terminalSettings.fontSize || 14,
      lineHeight: terminalSettings.lineHeight || 1.2,
      scrollback: terminalSettings.scrollback || 1000,
      convertEol: true,
      theme: this.getTheme(terminalSettings.theme),
    };
  }

  getTheme(themeName = 'default') {
    // Default theme
    const defaultTheme = {
      background: '#000000',
      foreground: '#ffffff',
      cursor: '#ffffff',
      selection: '#3366ff',
      black: '#000000',
      red: '#ff6b6b',
      green: '#4ecdc4',
      yellow: '#ffe66d',
      blue: '#4dabf7',
      magenta: '#ff6b9d',
      cyan: '#4ecdc4',
      white: '#ffffff',
      brightBlack: '#666666',
      brightRed: '#ff7979',
      brightGreen: '#6bcf7f',
      brightYellow: '#ffd93d',
      brightBlue: '#74b9ff',
      brightMagenta: '#fd79a8',
      brightCyan: '#7bed9f',
      brightWhite: '#ffffff',
    };

    // You can add more themes here
    const themes = {
      default: defaultTheme,
      dark: defaultTheme,
      // Add more themes as needed
    };

    return themes[themeName] || defaultTheme;
  }

  createTerminal(containerId, options = {}) {
    if (!this.isInitialized) {
      return null;
    }

    // Check if xterm globals are available
    if (typeof Terminal === 'undefined') {
      return null;
    }

    const config = { ...this.defaultTerminalConfig, ...options };
    const terminal = new Terminal(config);

    // Add addons
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal in container
    const container = document.getElementById(containerId);
    if (container) {
      terminal.open(container);
      fitAddon.fit();
    }

    return {
      terminal,
      fitAddon,
      webLinksAddon,
      config,
    };
  }

  async createBackendTerminal(options = {}) {
    try {
      const result = await window.electronAPI.createTerminalWithOptions(
        options
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.applySettings();
  }
}

// Initialize global terminal manager
const terminalManager = new RendererTerminalManager();

// Terminal variables
let terminal;
let fitAddon;
let webLinksAddon;
let currentTerminalId = null;

async function initializeTerminal() {
  try {
    // Check if required globals are available
    if (typeof Terminal === 'undefined') {
      return;
    }
    if (typeof FitAddon === 'undefined') {
      return;
    }
    if (typeof WebLinksAddon === 'undefined') {
      return;
    }

    await terminalManager.initialize();

    const terminalComponents = terminalManager.createTerminal('terminal');
    if (terminalComponents) {
      terminal = terminalComponents.terminal;
      fitAddon = terminalComponents.fitAddon;
      webLinksAddon = terminalComponents.webLinksAddon;

      // Create backend terminal and get the ID
      try {
        const backendResult =
          await window.electronAPI.createTerminalWithOptions();
        currentTerminalId = backendResult.id;
      } catch (error) {
        try {
          await window.electronAPI.createTerminal();
        } catch (fallbackError) {
          throw fallbackError;
        }
      }

      // Set up terminal event handlers
      await setupTerminalHandlers();

      // Update status
      updateStatus(true);
    }
  } catch (error) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.textContent = 'Error';
      statusElement.parentElement.style.color = '#ff6b6b';
    }
  }
}

// Initialize terminal when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTerminal);
} else {
  initializeTerminal();
}

// Status element
let statusElement;

// Modal Input Handler
class ModalInputHandler {
  constructor() {
    this.modal = null;
    this.modalTitle = null;
    this.modalPrompt = null;
    this.modalInput = null;
    this.modalConfirm = null;
    this.modalCancel = null;
    this.modalClose = null;
    this.currentCallback = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('input-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalPrompt = document.getElementById('modal-prompt');
    this.modalInput = document.getElementById('modal-input');
    this.modalConfirm = document.getElementById('modal-confirm');
    this.modalCancel = document.getElementById('modal-cancel');
    this.modalClose = document.getElementById('modal-close');

    // Bind event listeners
    this.modalConfirm.addEventListener('click', () => this.handleConfirm());
    this.modalCancel.addEventListener('click', () => this.hideModal());
    this.modalClose.addEventListener('click', () => this.hideModal());

    // Close modal when clicking outside
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    // Handle Enter key in input field
    this.modalInput.addEventListener('keydown', e => {
      e.stopPropagation(); // Prevent event from bubbling to terminal
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideModal();
      }
    });

    // Ensure input field is selectable and focusable
    this.modalInput.addEventListener('click', e => {
      e.stopPropagation();
      this.modalInput.focus();
      this.modalInput.select();
    });
  }

  showModal(title, prompt, callback) {
    this.modalTitle.textContent = title;
    this.modalPrompt.textContent = prompt;
    this.modalInput.value = '';
    this.currentCallback = callback;
    this.modal.style.display = 'flex';

    // Use setTimeout to ensure the modal is visible before focusing
    setTimeout(() => {
      this.modalInput.focus();
      this.modalInput.select();
    }, 50);
  }

  hideModal() {
    this.modal.style.display = 'none';
    this.currentCallback = null;
    // Return focus to terminal
    setTimeout(() => {
      terminal.focus();
    }, 100);
  }

  handleConfirm() {
    const value = this.modalInput.value.trim();
    if (value && this.currentCallback) {
      this.currentCallback(value);
    }
    this.hideModal();
  }
}

// Create Modal Input Handler instance
const modalHandler = new ModalInputHandler();

// Command buffer to track what user is typing
let currentCommand = '';

// Update status
function updateStatus(connected) {
  // Get status element fresh each time to ensure it exists
  if (!statusElement) {
    statusElement = document.getElementById('connection-status');
  }

  if (statusElement) {
    if (connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status disconnected';
    }
  } else {
    console.warn('Status element not found');
  }
}

// Initialize terminal event handlers after terminal is created
async function setupTerminalHandlers() {
  if (!terminal) {
    return;
  }

  // Handle terminal data input
  terminal.onData(data => {
    if (currentTerminalId) {
      window.electronAPI.writeToTerminalById(currentTerminalId, data);
    } else {
      window.electronAPI.writeToTerminal(data);
    }

    // Track commands for simple command buffer (not path-related)
    if (data === '\r' || data === '\n') {
      // User pressed Enter
      currentCommand = '';
    } else if (data === '\u007f' || data === '\b') {
      // Backspace - remove last character
      currentCommand = currentCommand.slice(0, -1);
    } else if (data.charCodeAt(0) >= 32) {
      // Printable character - add to command buffer
      currentCommand += data;
    }
  });

  // Handle terminal resize
  terminal.onResize(({ cols, rows }) => {
    if (currentTerminalId) {
      window.electronAPI.resizeTerminalById(currentTerminalId, cols, rows);
    } else {
      window.electronAPI.resizeTerminal(cols, rows);
    }
  });
}

// Listen for data from the main process
window.electronAPI.onTerminalData(data => {
  // Handle both old format (string) and new format (object with terminalId)
  if (typeof data === 'string') {
    terminal.write(data);
  } else if (data && data.data) {
    // New format with terminal ID
    if (!currentTerminalId || data.terminalId === currentTerminalId) {
      terminal.write(data.data);
    }
  }
});

// Listen for terminal exit
window.electronAPI.onTerminalExit(data => {
  // Handle both old and new format
  const code = data?.code || (data?.terminalId ? data.code : data);
  // More robust handling of exit data
  let exitCode = 'unknown';
  let signal = null;

  if (data !== null && typeof data === 'object') {
    exitCode =
      data.code?.exitCode !== undefined ? data.code?.exitCode : 'unknown';
    signal = data.signal !== undefined ? data.signal : null;
  } else {
    exitCode = data;
  }

  terminal.writeln(
    `\r\n\x1b[31mTerminal process exited with code: ${exitCode}\x1b[0m`
  );
  if (signal) {
    terminal.writeln(`\x1b[31mSignal: ${signal}\x1b[0m`);
  }
  terminal.writeln(
    '\x1b[33mPress "New Terminal" to start a new session\x1b[0m'
  );

  // Update status to disconnected
  updateStatus(false);
});

// Listen for terminal page ready signal
if (window.electronAPI.onTerminalPageReady) {
  window.electronAPI.onTerminalPageReady(() => {
    // Verify terminal connection status
    setTimeout(() => {
      // If we have a terminal process, make sure status reflects it
      if (terminal && terminal.element) {
        updateStatus(true);
      }
    }, 100);
  });
}

// Initialize application on page load
document.addEventListener('DOMContentLoaded', function () {
  // Initialize settings manager if not already done
  if (typeof settingsManager !== 'undefined' && settingsManager) {
    // Apply saved theme on startup with a slight delay to ensure everything is ready
    setTimeout(async () => {
      await settingsManager.applyTheme();
      await settingsManager.applyTerminalSettings();
    }, 100);
  }

  // Fit terminal to initial container size
  if (typeof fitAddon !== 'undefined' && fitAddon) {
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
  }

  // Focus terminal if auto focus is enabled
  if (typeof terminal !== 'undefined' && terminal) {
    const autoFocus = localStorage.getItem('terminalSettings');
    if (autoFocus) {
      try {
        const settings = JSON.parse(autoFocus);
        if (settings.autoFocus !== false) {
          setTimeout(() => terminal.focus(), 200);
        }
      } catch (e) {
        // Default to auto focus if settings can't be parsed
        setTimeout(() => terminal.focus(), 200);
      }
    } else {
      // Default to auto focus
      setTimeout(() => terminal.focus(), 200);
    }
  }
});

// Handle window resize
window.addEventListener('resize', function () {
  if (typeof fitAddon !== 'undefined' && fitAddon) {
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
  }
});

// Create initial terminal when the app starts
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize status element reference
  statusElement = document.getElementById('connection-status');

  // Set initial status to connecting
  updateStatus(false);

  try {
    // Small delay to ensure proper initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if terminal already exists
    const terminalStatus = await window.electronAPI.checkTerminalStatus();

    if (terminalStatus.exists && terminalStatus.isAlive) {
      updateStatus(true);
      terminal.focus();
    } else {
      await window.electronAPI.createTerminal();
      updateStatus(true);
      terminal.focus();
    }

    // Initial fit
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
  } catch (error) {
    updateStatus(false);
    terminal.writeln(
      '\x1b[31mFailed to create terminal. Click "New Terminal" to try again.\x1b[0m'
    );
  }
});

// Focus terminal when window is clicked
document.addEventListener('click', () => {
  terminal.focus();
});

// Clean up listeners when the window is closed
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeAllListeners();
});

// Sidebar functionality
document.addEventListener('DOMContentLoaded', () => {
  // Terminal control buttons
  const newTerminalBtn = document.getElementById('new-terminal');
  const killTerminalBtn = document.getElementById('kill-terminal');

  if (newTerminalBtn) {
    newTerminalBtn.addEventListener('click', async () => {
      try {
        // Update status to connecting first
        updateStatus(false);

        // Create the terminal using new API
        const result = await window.electronAPI.createTerminalWithOptions();
        currentTerminalId = result.id;

        // Update status to connected after successful creation
        updateStatus(true);
        terminal.focus();
      } catch (error) {
        // Try fallback
        try {
          await window.electronAPI.createTerminal();
          updateStatus(true);
          terminal.focus();
        } catch (fallbackError) {
          updateStatus(false);
        }
      }
    });
  }

  if (killTerminalBtn) {
    killTerminalBtn.addEventListener('click', async () => {
      try {
        if (currentTerminalId) {
          await window.electronAPI.killTerminalById(currentTerminalId);
        } else {
          await window.electronAPI.killTerminal();
        }
        updateStatus(false);
        terminal.writeln('\x1b[31mTerminal process killed\x1b[0m');
        currentTerminalId = null;
      } catch (error) {}
    });
  }

  // Git dropdown toggle
  const gitCommandsBtn = document.getElementById('git-commands');
  const gitDropdown = document.getElementById('git-dropdown');

  if (gitCommandsBtn && gitDropdown) {
    gitCommandsBtn.addEventListener('click', e => {
      e.stopPropagation();
      gitDropdown.classList.toggle('show');
      gitCommandsBtn.classList.toggle('active');

      // Close FluPilot dropdown if open
      const flupilotDropdown = document.getElementById('flupilot-dropdown');
      const flupilotCommandsBtn = document.getElementById('flupilot-commands');
      if (flupilotDropdown && flupilotCommandsBtn) {
        flupilotDropdown.classList.remove('show');
        flupilotCommandsBtn.classList.remove('active');
      }
    });
  }

  // FluPilot dropdown toggle
  const flupilotCommandsBtn = document.getElementById('flupilot-commands');
  const flupilotDropdown = document.getElementById('flupilot-dropdown');

  if (flupilotCommandsBtn && flupilotDropdown) {
    flupilotCommandsBtn.addEventListener('click', e => {
      e.stopPropagation();
      flupilotDropdown.classList.toggle('show');
      flupilotCommandsBtn.classList.toggle('active');

      // Close Git dropdown if open
      if (gitDropdown && gitCommandsBtn) {
        gitDropdown.classList.remove('show');
        gitCommandsBtn.classList.remove('active');
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', e => {
    // Close Git dropdown
    if (gitCommandsBtn && gitDropdown) {
      if (
        !gitCommandsBtn.contains(e.target) &&
        !gitDropdown.contains(e.target)
      ) {
        gitDropdown.classList.remove('show');
        gitCommandsBtn.classList.remove('active');
      }
    }

    // Close FluPilot dropdown
    if (flupilotCommandsBtn && flupilotDropdown) {
      if (
        !flupilotCommandsBtn.contains(e.target) &&
        !flupilotDropdown.contains(e.target)
      ) {
        flupilotDropdown.classList.remove('show');
        flupilotCommandsBtn.classList.remove('active');
      }
    }
  });

  // Handle dropdown command clicks
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', async e => {
      const command = e.target.getAttribute('data-cmd');
      const prompt = e.target.getAttribute('data-prompt');

      if (command) {
        // Check if this command needs user input
        if (prompt && command.endsWith(' ')) {
          // Show modal to get user input
          modalHandler.showModal('Git Command', prompt, async userInput => {
            const fullCommand = command + userInput;

            // Ensure we have an active terminal
            if (!currentTerminalId) {
              try {
                const result =
                  await window.electronAPI.createTerminalWithOptions();
                currentTerminalId = result.id;
                // Wait a bit for terminal to be ready
                await new Promise(resolve => setTimeout(resolve, 200));
              } catch (error) {
                return;
              }
            }

            // Send complete command to terminal
            if (
              window.electronAPI &&
              window.electronAPI.sendCommandToTerminal &&
              currentTerminalId
            ) {
              window.electronAPI.sendCommandToTerminal(
                currentTerminalId,
                fullCommand
              );
            } else if (window.electronAPI && window.electronAPI.sendCommand) {
              window.electronAPI.sendCommand(fullCommand);
            } else {
              // Fallback: write to terminal directly
              terminal.write(fullCommand + '\r');
            }
          });
        } else {
          // Ensure we have an active terminal
          if (!currentTerminalId) {
            try {
              const result =
                await window.electronAPI.createTerminalWithOptions();
              currentTerminalId = result.id;
              // Wait a bit for terminal to be ready
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              return;
            }
          }

          // Send command directly to terminal
          if (
            window.electronAPI &&
            window.electronAPI.sendCommandToTerminal &&
            currentTerminalId
          ) {
            window.electronAPI.sendCommandToTerminal(
              currentTerminalId,
              command
            );
          } else if (window.electronAPI && window.electronAPI.sendCommand) {
            window.electronAPI.sendCommand(command);
          } else {
            // Fallback: write to terminal directly
            terminal.write(command + '\r');
          }
        }

        // Close all dropdowns
        if (gitDropdown && gitCommandsBtn) {
          gitDropdown.classList.remove('show');
          gitCommandsBtn.classList.remove('active');
        }
        if (flupilotDropdown && flupilotCommandsBtn) {
          flupilotDropdown.classList.remove('show');
          flupilotCommandsBtn.classList.remove('active');
        }
      }
    });
  });

  // Handle quick command buttons
  const quickCmds = document.querySelectorAll('.quick-cmd');
  quickCmds.forEach(btn => {
    btn.addEventListener('click', async e => {
      const command = e.target.getAttribute('data-cmd');
      if (command && command.trim()) {
        // Ensure we're on the terminal page and terminal is ready
        if (!currentTerminalId) {
          try {
            const result = await window.electronAPI.createTerminalWithOptions();
            currentTerminalId = result.id;
            // Wait a bit for terminal to be ready
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            return;
          }
        }

        // Send command to terminal with terminalId
        if (
          window.electronAPI &&
          window.electronAPI.sendCommandToTerminal &&
          currentTerminalId
        ) {
          window.electronAPI.sendCommandToTerminal(currentTerminalId, command);
        } else if (window.electronAPI && window.electronAPI.sendCommand) {
          // Fallback to legacy method
          window.electronAPI.sendCommand(command);
        } else if (window.electronAPI && window.electronAPI.writeToTerminal) {
          // Fallback: write to terminal directly
          window.electronAPI.writeToTerminal(command + '\r');
        } else if (terminal) {
          // Last fallback: write to terminal directly
          terminal.write(command + '\r');
        }
      }
    });
  });

  // Settings button functionality
  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {});
  }

  // Keyboard shortcuts for sidebar
  document.addEventListener('keydown', e => {
    // Ctrl/Cmd + Shift + G for Git commands
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      if (gitCommandsBtn) {
        gitCommandsBtn.click();
      }
    }

    // Ctrl/Cmd + Shift + S for Settings
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      if (sidebarSettingsBtn) {
        sidebarSettingsBtn.click();
      }
    }
  });

  // Add hover effects and tooltips
  const toolbarBtns = document.querySelectorAll('.toolbar-btn, .quick-cmd');
  toolbarBtns.forEach(btn => {
    btn.addEventListener('mouseenter', e => {
      const tooltip =
        e.target.getAttribute('data-cmd') || e.target.textContent.trim();
      e.target.setAttribute('title', tooltip);
    });
  });
});

// Settings Management System
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      theme: 'dark',
      customTheme: null,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorStyle: 'block',
      cursorBlink: true,
      scrollback: 1000,
      convertEol: true,
      webLinks: true,
      autoFocus: true,
      saveSession: false,
      terminalTheme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#3366ff',
        black: '#000000',
        red: '#ff6b6b',
        green: '#4ecdc4',
        yellow: '#ffe66d',
        blue: '#4dabf7',
        magenta: '#ff6b9d',
        cyan: '#4ecdc4',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff7979',
        brightGreen: '#6bcf7f',
        brightYellow: '#ffd93d',
        brightBlue: '#74b9ff',
        brightMagenta: '#fd79a8',
        brightCyan: '#7bed9f',
        brightWhite: '#ffffff',
      },
      appTheme: {
        bgPrimary: '#000000',
        bgSecondary: '#1a1a1a',
        bgTertiary: '#2d2d2d',
        bgQuaternary: '#404040',
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
        textTertiary: '#999999',
        accentPrimary: '#2d5aa0',
        accentSecondary: '#3d6bb0',
        borderPrimary: '#404040',
        borderSecondary: '#555555',
        successColor: '#4ecdc4',
        errorColor: '#ff6b6b',
        warningColor: '#ffe66d',
      },
    };

    this.currentSettings = this.loadSettings();
    this.modal = null;
    this.initializeModal();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('terminalSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      throw error;
    }
    return { ...this.defaultSettings };
  }

  saveSettings() {
    try {
      localStorage.setItem(
        'terminalSettings',
        JSON.stringify(this.currentSettings)
      );
      return true;
    } catch (error) {
      throw error;
      return false;
    }
  }

  async initializeModal() {
    this.modal = document.getElementById('settings-modal');
    this.setupEventListeners();
    this.loadCurrentSettings();
    await this.applyTheme();
  }

  setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('sidebar-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openModal());
    }

    // Modal close events
    const closeBtn = document.getElementById('settings-modal-close');
    const cancelBtn = document.getElementById('settings-cancel');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

    // Modal overlay click
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Tab switching
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => this.switchTab(e.target.dataset.tab));
    });

    // Apply settings
    const applyBtn = document.getElementById('settings-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applySettings());
    }

    // Reset settings
    const resetBtn = document.getElementById('settings-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSettings());
    }

    // File upload
    const fileUpload = document.getElementById('theme-upload');
    const uploadBtn = document.querySelector('.file-upload-btn');
    if (uploadBtn && fileUpload) {
      uploadBtn.addEventListener('click', () => fileUpload.click());
      fileUpload.addEventListener('change', e => this.handleThemeUpload(e));
    }

    // Export theme
    const exportBtn = document.getElementById('export-theme-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportTheme());
    }

    // Range inputs
    const rangeInputs = document.querySelectorAll('.range-input');
    rangeInputs.forEach(input => {
      input.addEventListener('input', e => this.updateRangeDisplay(e));
    });

    // Preview updates
    const previewInputs = [
      'theme-select',
      'font-family',
      'font-size',
      'line-height',
    ];
    previewInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.updatePreview());
      }
    });

    // Ensure select dropdowns work properly
    const selectInputs = document.querySelectorAll('select.setting-input');
    selectInputs.forEach(select => {
      // Prevent event propagation issues
      select.addEventListener('click', e => {
        e.stopPropagation();
      });

      // Ensure proper focus behavior
      select.addEventListener('focus', e => {
        e.target.style.borderColor = '#2d5aa0';
        e.target.style.boxShadow = '0 0 0 2px rgba(45, 90, 160, 0.2)';
      });

      select.addEventListener('blur', e => {
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';
      });
    });

    // Setup checkbox event listeners
    const checkboxInputs = document.querySelectorAll('input[type="checkbox"]');
    checkboxInputs.forEach(checkbox => {
      // Prevent event propagation issues
      checkbox.addEventListener('click', e => {
        e.stopPropagation();
      });

      // Add change event for immediate feedback
      checkbox.addEventListener('change', e => {
        // Update settings preview for certain checkboxes
        if (e.target.id === 'cursor-blink') {
          this.updatePreview();
        }

        // Provide visual feedback with formatted message
        const settingName = e.target.id
          .replace(/-/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        const status = e.target.checked ? 'enabled' : 'disabled';
        this.showNotification(`${settingName} ${status}`, 'info');
      });

      // Ensure proper focus behavior
      checkbox.addEventListener('focus', e => {
        e.target.style.outline = '2px solid #2d5aa0';
        e.target.style.outlineOffset = '2px';
      });

      checkbox.addEventListener('blur', e => {
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
      });

      // Add keyboard support
      checkbox.addEventListener('keydown', e => {
        // Space bar to toggle (default behavior but ensure it works)
        if (e.key === ' ') {
          e.preventDefault();
          checkbox.checked = !checkbox.checked;
          // Trigger change event manually
          checkbox.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  openModal() {
    this.loadCurrentSettings();
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  loadCurrentSettings() {
    // Load theme
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = this.currentSettings.theme;

    // Load font settings
    const fontFamily = document.getElementById('font-family');
    if (fontFamily) fontFamily.value = this.currentSettings.fontFamily;

    const fontSize = document.getElementById('font-size');
    if (fontSize) {
      fontSize.value = this.currentSettings.fontSize;
      this.updateRangeDisplay({ target: fontSize });
    }

    const lineHeight = document.getElementById('line-height');
    if (lineHeight) {
      lineHeight.value = this.currentSettings.lineHeight;
      this.updateRangeDisplay({ target: lineHeight });
    }

    // Load cursor settings
    const cursorStyle = document.getElementById('cursor-style');
    if (cursorStyle) cursorStyle.value = this.currentSettings.cursorStyle;

    const cursorBlink = document.getElementById('cursor-blink');
    if (cursorBlink) cursorBlink.checked = this.currentSettings.cursorBlink;

    // Load behavior settings
    const scrollback = document.getElementById('scrollback');
    if (scrollback) scrollback.value = this.currentSettings.scrollback;

    const convertEol = document.getElementById('convert-eol');
    if (convertEol) convertEol.checked = this.currentSettings.convertEol;

    const webLinks = document.getElementById('web-links');
    if (webLinks) webLinks.checked = this.currentSettings.webLinks;

    const autoFocus = document.getElementById('auto-focus');
    if (autoFocus) autoFocus.checked = this.currentSettings.autoFocus;

    const saveSession = document.getElementById('save-session');
    if (saveSession) saveSession.checked = this.currentSettings.saveSession;

    this.updatePreview();
  }

  updateRangeDisplay(event) {
    const input = event.target;
    const valueDisplay = document.getElementById(`${input.id}-value`);
    if (valueDisplay) {
      let value = input.value;
      if (input.id === 'font-size') {
        value += 'px';
      }
      valueDisplay.textContent = value;
    }
  }

  async updatePreview() {
    const previewTerminal = document.querySelector('.preview-terminal');
    if (!previewTerminal) return;

    const fontFamily =
      document.getElementById('font-family')?.value ||
      this.currentSettings.fontFamily;
    const fontSize =
      document.getElementById('font-size')?.value ||
      this.currentSettings.fontSize;
    const lineHeight =
      document.getElementById('line-height')?.value ||
      this.currentSettings.lineHeight;

    previewTerminal.style.fontFamily = fontFamily;
    previewTerminal.style.fontSize = `${Math.max(fontSize * 0.8, 10)}px`;
    previewTerminal.style.lineHeight = lineHeight;

    // Update preview with current theme selection
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      const selectedTheme = themeSelect.value;
      let theme;

      if (selectedTheme === 'custom' && this.currentSettings.customTheme) {
        theme = this.currentSettings.customTheme;
      } else if (selectedTheme === 'light') {
        theme = this.getLightTheme();
      } else if (
        [
          'dracula',
          'monokai',
          'solarized-dark',
          'catppuccin-mocha',
          'gruvbox-dark',
          'one-dark',
          'nord',
          'palenight',
          'tokyo-night',
        ].includes(selectedTheme)
      ) {
        // Temporarily update the current theme to show preview
        const originalTheme = this.currentSettings.theme;
        this.currentSettings.theme = selectedTheme;
        theme = await this.getActiveTheme();
        this.currentSettings.theme = originalTheme; // Restore original
      } else {
        theme = {
          terminalTheme: this.currentSettings.terminalTheme,
          appTheme: this.currentSettings.appTheme,
        };
      }

      if (theme && theme.terminalTheme) {
        previewTerminal.style.backgroundColor = theme.terminalTheme.background;
        previewTerminal.style.color = theme.terminalTheme.foreground;

        // Update preview line colors if available
        const previewLines = previewTerminal.querySelectorAll('.preview-line');
        previewLines.forEach((line, index) => {
          if (line.classList.contains('preview-output')) {
            line.style.color =
              theme.terminalTheme.green || theme.terminalTheme.foreground;
          } else {
            line.style.color = theme.terminalTheme.foreground;
          }
        });

        // Update cursor color
        const cursor = previewTerminal.querySelector('.preview-cursor');
        if (cursor) {
          cursor.style.color =
            theme.terminalTheme.cursor || theme.terminalTheme.foreground;
        }
      }
    }
  }

  handleThemeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = document.getElementById('theme-file-name');
    if (fileName) fileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const themeData = JSON.parse(e.target.result);

        if (this.validateTheme(themeData)) {
          // Convert theme to expected format if necessary
          const convertedTheme = this.convertThemeFormat(themeData);

          if (convertedTheme) {
            this.currentSettings.customTheme = convertedTheme;
            document.getElementById('theme-select').value = 'custom';
            this.updatePreview();
            this.showNotification(
              'Theme uploaded and converted successfully!',
              'success'
            );
          } else {
            this.showNotification('Failed to convert theme format!', 'error');
          }
        } else {
          this.showNotification(
            'Invalid theme format! Please ensure your theme has either "terminalTheme" and "appTheme" properties, or a "colors" object with at least "background" and "foreground" colors.',
            'error'
          );
        }
      } catch (error) {
        this.showNotification(
          'Failed to parse theme file! Please check that your JSON is valid.',
          'error'
        );
      }
    };
    reader.readAsText(file);
  }

  convertThemeFormat(theme) {
    // If already in expected format, return as is
    if (theme.terminalTheme && theme.appTheme) {
      return theme;
    }

    // Convert from colors format to expected format
    if (theme.colors) {
      const colors = theme.colors;

      const convertedTheme = {
        name: theme.name || 'Custom Theme',
        version: theme.version || '1.0.0',
        author: theme.metadata?.author || theme.author || 'Unknown',
        description: theme.description || 'Custom uploaded theme',
        terminalTheme: {
          background: colors.background || '#000000',
          foreground: colors.foreground || '#ffffff',
          cursor: colors.cursor || colors.foreground || '#ffffff',
          selection: colors.selection || colors.background || '#000000',
          black: colors.black || '#000000',
          red: colors.red || '#ff0000',
          green: colors.green || '#00ff00',
          yellow: colors.yellow || '#ffff00',
          blue: colors.blue || '#0000ff',
          magenta: colors.magenta || '#ff00ff',
          cyan: colors.cyan || '#00ffff',
          white: colors.white || '#ffffff',
          brightBlack: colors.brightBlack || colors.black || '#000000',
          brightRed: colors.brightRed || colors.red || '#ff0000',
          brightGreen: colors.brightGreen || colors.green || '#00ff00',
          brightYellow: colors.brightYellow || colors.yellow || '#ffff00',
          brightBlue: colors.brightBlue || colors.blue || '#0000ff',
          brightMagenta: colors.brightMagenta || colors.magenta || '#ff00ff',
          brightCyan: colors.brightCyan || colors.cyan || '#00ffff',
          brightWhite: colors.brightWhite || colors.white || '#ffffff',
        },
        appTheme: {
          bgPrimary: colors.background || '#000000',
          bgSecondary: this.adjustBrightness(
            colors.background || '#000000',
            0.1
          ),
          bgTertiary: this.adjustBrightness(
            colors.background || '#000000',
            0.2
          ),
          bgQuaternary: this.adjustBrightness(
            colors.background || '#000000',
            0.3
          ),
          textPrimary: colors.foreground || '#ffffff',
          textSecondary: this.adjustBrightness(
            colors.foreground || '#ffffff',
            -0.1
          ),
          textTertiary: this.adjustBrightness(
            colors.foreground || '#ffffff',
            -0.2
          ),
          accentPrimary: colors.blue || colors.cyan || '#0099ff',
          accentSecondary: colors.magenta || colors.brightBlue || '#9966ff',
          borderPrimary: this.adjustBrightness(
            colors.background || '#000000',
            0.2
          ),
          borderSecondary: this.adjustBrightness(
            colors.background || '#000000',
            0.3
          ),
          successColor: colors.green || '#00ff00',
          errorColor: colors.red || '#ff0000',
          warningColor: colors.yellow || '#ffff00',
        },
      };

      return convertedTheme;
    }

    return null;
  }

  adjustBrightness(color, amount) {
    // Simple function to adjust color brightness
    // Remove # if present
    color = color.replace(/^#/, '');

    // Parse RGB components
    const num = parseInt(color, 16);
    const r = (num >> 16) + Math.round(255 * amount);
    const g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
    const b = (num & 0x0000ff) + Math.round(255 * amount);

    // Clamp values between 0 and 255
    const clamp = val => Math.max(0, Math.min(255, val));

    return (
      '#' +
      ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b))
        .toString(16)
        .slice(1)
    );
  }

  validateTheme(theme) {
    // Check for the expected format (terminalTheme + appTheme)
    const expectedFormat = ['terminalTheme', 'appTheme'];
    if (expectedFormat.every(prop => theme.hasOwnProperty(prop))) {
      return true;
    }

    // Check for alternative format (colors object with terminal color names)
    if (theme.colors && typeof theme.colors === 'object') {
      const requiredTerminalColors = ['background', 'foreground'];
      return requiredTerminalColors.every(color =>
        theme.colors.hasOwnProperty(color)
      );
    }

    return false;
  }

  exportTheme() {
    const themeData = {
      name: 'Custom Terminal Theme',
      version: '1.0.0',
      author: 'User',
      description: 'Exported from Electron Terminal',
      terminalTheme: this.currentSettings.terminalTheme,
      appTheme: this.currentSettings.appTheme,
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-theme.json';
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Theme exported successfully!', 'success');
  }

  async applySettings() {
    // Collect settings from form
    const newSettings = { ...this.currentSettings };

    // Theme settings
    newSettings.theme =
      document.getElementById('theme-select')?.value || newSettings.theme;

    // Font settings
    newSettings.fontFamily =
      document.getElementById('font-family')?.value || newSettings.fontFamily;
    newSettings.fontSize =
      parseInt(document.getElementById('font-size')?.value) ||
      newSettings.fontSize;
    newSettings.lineHeight =
      parseFloat(document.getElementById('line-height')?.value) ||
      newSettings.lineHeight;

    // Cursor settings
    newSettings.cursorStyle =
      document.getElementById('cursor-style')?.value || newSettings.cursorStyle;
    newSettings.cursorBlink =
      document.getElementById('cursor-blink')?.checked ??
      newSettings.cursorBlink;

    // Behavior settings
    newSettings.scrollback =
      parseInt(document.getElementById('scrollback')?.value) ||
      newSettings.scrollback;
    newSettings.convertEol =
      document.getElementById('convert-eol')?.checked ?? newSettings.convertEol;
    newSettings.webLinks =
      document.getElementById('web-links')?.checked ?? newSettings.webLinks;
    newSettings.autoFocus =
      document.getElementById('auto-focus')?.checked ?? newSettings.autoFocus;
    newSettings.saveSession =
      document.getElementById('save-session')?.checked ??
      newSettings.saveSession;

    this.currentSettings = newSettings;

    if (this.saveSettings()) {
      await this.applyTheme();
      await this.applyTerminalSettings();
      this.showNotification('Settings applied successfully!', 'success');
      this.closeModal();
    } else {
      this.showNotification('Failed to save settings!', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.currentSettings = { ...this.defaultSettings };
      this.saveSettings();
      this.loadCurrentSettings();
      await this.applyTheme();
      await this.applyTerminalSettings();
      this.showNotification('Settings reset to defaults!', 'success');
    }
  }

  async applyTheme() {
    const theme = await this.getActiveTheme();
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(theme.appTheme).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply theme class
    document.body.className = `theme-${this.currentSettings.theme}`;
  }

  async applyTerminalSettings() {
    if (typeof terminal !== 'undefined' && terminal) {
      const theme = await this.getActiveTheme();

      // Update terminal options
      terminal.options.fontFamily = this.currentSettings.fontFamily;
      terminal.options.fontSize = this.currentSettings.fontSize;
      terminal.options.lineHeight = this.currentSettings.lineHeight;
      terminal.options.cursorStyle = this.currentSettings.cursorStyle;
      terminal.options.cursorBlink = this.currentSettings.cursorBlink;
      terminal.options.scrollback = this.currentSettings.scrollback;
      terminal.options.convertEol = this.currentSettings.convertEol;

      // Apply theme with a forced refresh
      terminal.options.theme = theme.terminalTheme;

      // Force a complete redraw to ensure theme is applied
      try {
        // Clear the terminal display to force background refresh
        terminal.clear();

        // Force refresh of all terminal content
        terminal.refresh(0, terminal.rows - 1);

        // Additional refresh after a brief delay to ensure the theme sticks
        setTimeout(() => {
          terminal.refresh(0, terminal.rows - 1);

          // For cursor blink changes, we need to focus and blur to trigger the change
          if (terminal.element) {
            terminal.blur();
            setTimeout(() => {
              terminal.focus();
            }, 10);
          }
        }, 50);
      } catch (error) {
        this.showNotification(
          'Failed to apply terminal settings. Please check console for details.',
          'error'
        );
      }

      // Refresh terminal layout
      if (typeof fitAddon !== 'undefined' && fitAddon) {
        setTimeout(() => {
          fitAddon.fit();
        }, 100);
      }
    }
  }

  async loadBuiltInTheme(themeName) {
    // Check cache first
    if (this.themeCache && this.themeCache[themeName]) {
      return this.themeCache[themeName];
    }

    try {
      const response = await fetch(`themes/${themeName}-theme.json`);
      if (!response.ok) {
        throw new Error(`Failed to load theme: ${response.status}`);
      }

      const themeData = await response.json();

      // Initialize cache if needed
      if (!this.themeCache) {
        this.themeCache = {};
      }

      // Cache the loaded theme
      this.themeCache[themeName] = themeData;

      return themeData;
    } catch (error) {
      this.showNotification(
        `Failed to load ${themeName} theme. Using default.`,
        'error'
      );
      return null;
    }
  }

  async getActiveTheme() {
    if (
      this.currentSettings.theme === 'custom' &&
      this.currentSettings.customTheme
    ) {
      return this.currentSettings.customTheme;
    }

    if (this.currentSettings.theme === 'light') {
      return this.getLightTheme();
    }

    // Handle built-in themes
    if (
      [
        'dracula',
        'monokai',
        'solarized-dark',
        'one-dark',
        'nord',
        'gruvbox-dark',
        'palenight',
        'tokyo-night',
        'catppuccin-mocha',
      ].includes(this.currentSettings.theme)
    ) {
      const builtInTheme = await this.loadBuiltInTheme(
        this.currentSettings.theme
      );
      if (builtInTheme) {
        return builtInTheme;
      }
      // Fall back to default dark theme if loading fails
    }

    return {
      terminalTheme: this.currentSettings.terminalTheme,
      appTheme: this.currentSettings.appTheme,
    };
  }

  getLightTheme() {
    return {
      terminalTheme: {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        selection: '#b3d4fc',
        black: '#000000',
        red: '#d32f2f',
        green: '#388e3c',
        yellow: '#f57c00',
        blue: '#1976d2',
        magenta: '#7b1fa2',
        cyan: '#00796b',
        white: '#ffffff',
        brightBlack: '#555555',
        brightRed: '#f44336',
        brightGreen: '#4caf50',
        brightYellow: '#ffeb3b',
        brightBlue: '#2196f3',
        brightMagenta: '#9c27b0',
        brightCyan: '#00bcd4',
        brightWhite: '#ffffff',
      },
      appTheme: {
        bgPrimary: '#ffffff',
        bgSecondary: '#f5f5f5',
        bgTertiary: '#e0e0e0',
        bgQuaternary: '#bdbdbd',
        textPrimary: '#000000',
        textSecondary: '#424242',
        textTertiary: '#757575',
        accentPrimary: '#1976d2',
        accentSecondary: '#2196f3',
        borderPrimary: '#e0e0e0',
        borderSecondary: '#bdbdbd',
        successColor: '#4caf50',
        errorColor: '#f44336',
        warningColor: '#ff9800',
      },
    };
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }
}

// Initialize settings manager
const settingsManager = new SettingsManager();

// Ensure themes are applied immediately after initialization
setTimeout(async () => {
  await settingsManager.applyTheme();
  await settingsManager.applyTerminalSettings();
}, 200);

// Development mode detection and initialization
document.addEventListener('DOMContentLoaded', async function () {
  // Check if we're in development mode
  if (window.electronAPI && window.electronAPI.getAppInfo) {
    try {
      const appInfo = await window.electronAPI.getAppInfo();

      if (appInfo.isDevelopment) {
        // Add development indicator to the title bar
        const titleElement = document.querySelector('.titlebar-title');
        if (titleElement) {
          titleElement.innerHTML = `${titleElement.textContent} <span style="color: #ff6b6b; font-size: 0.8em;">[DEV]</span>`;
        }
      }
    } catch (error) {}
  }
});
