/**
 * Enhanced Terminal Manager with better lifecycle management
 */

const pty = require('node-pty');
const os = require('os');
const Logger = require('../utils/logger');
const { TerminalError, validators } = require('../utils/errorHandling');

class TerminalManager {
  constructor() {
    this.logger = new Logger('TerminalManager');
    this.terminals = new Map(); // Support multiple terminals
    this.activeTerminalId = null;
    this.terminalCounter = 0;
  }

  // Create a new terminal instance
  createTerminal(options = {}) {
    try {
      const terminalId = `terminal_${++this.terminalCounter}`;

      const defaultOptions = {
        shell: this._getDefaultShell(),
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: { ...process.env, TERM: 'xterm-256color' },
      };

      const terminalOptions = { ...defaultOptions, ...options };

      // Validate terminal size
      if (
        !validators.isValidTerminalSize(
          terminalOptions.cols,
          terminalOptions.rows
        )
      ) {
        throw new TerminalError('Invalid terminal size specified');
      }

      this.logger.info(`Creating terminal ${terminalId}`, terminalOptions);

      const ptyProcess = pty.spawn(terminalOptions.shell, [], {
        name: 'xterm-color',
        cols: terminalOptions.cols,
        rows: terminalOptions.rows,
        cwd: terminalOptions.cwd,
        env: terminalOptions.env,
      });

      const terminal = {
        id: terminalId,
        process: ptyProcess,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.terminals.set(terminalId, terminal);
      this.activeTerminalId = terminalId;

      this.logger.info(`Terminal ${terminalId} created successfully`);
      return { id: terminalId, cols: ptyProcess.cols, rows: ptyProcess.rows };
    } catch (error) {
      this.logger.error('Failed to create terminal', error);
      throw new TerminalError(`Failed to create terminal: ${error.message}`);
    }
  }

  // Get terminal by ID
  getTerminal(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      throw new TerminalError(`Terminal ${terminalId} not found`);
    }
    return terminal;
  }

  // Write data to specific terminal
  writeToTerminal(terminalId, data) {
    try {
      const terminal = this.getTerminal(terminalId);
      if (!terminal.isActive) {
        throw new TerminalError(`Terminal ${terminalId} is not active`);
      }

      terminal.process.write(data);
      terminal.lastActivity = new Date();
      this.logger.debug(`Data written to terminal ${terminalId}`);
    } catch (error) {
      this.logger.error(`Failed to write to terminal ${terminalId}`, error);
      throw error;
    }
  }

  // Send command to terminal
  sendCommand(terminalId, command) {
    this.logger.debug(
      `Attempting to send command to terminal ${terminalId}: "${command}"`
    );

    if (!validators.isValidCommand(command)) {
      this.logger.error(
        `Invalid command rejected: "${command}" (type: ${typeof command}, length: ${
          command?.length
        })`
      );
      throw new TerminalError(
        `Invalid or potentially dangerous command: "${command}"`
      );
    }

    this.writeToTerminal(terminalId, command + '\r');
    this.logger.info(`Command sent to terminal ${terminalId}: ${command}`);
  }

  // Resize terminal
  resizeTerminal(terminalId, cols, rows) {
    try {
      if (!validators.isValidTerminalSize(cols, rows)) {
        throw new TerminalError('Invalid terminal size');
      }

      const terminal = this.getTerminal(terminalId);
      terminal.process.resize(cols, rows);
      this.logger.info(`Terminal ${terminalId} resized to ${cols}x${rows}`);
    } catch (error) {
      this.logger.error(`Failed to resize terminal ${terminalId}`, error);
      throw error;
    }
  }

  // Kill specific terminal
  killTerminal(terminalId) {
    try {
      const terminal = this.getTerminal(terminalId);

      if (terminal.process && !terminal.process.killed) {
        terminal.process.kill();
        this.logger.info(`Terminal ${terminalId} killed`);
      }

      terminal.isActive = false;
      this.terminals.delete(terminalId);

      // If this was the active terminal, find another one or clear
      if (this.activeTerminalId === terminalId) {
        const remainingTerminals = Array.from(this.terminals.keys());
        this.activeTerminalId =
          remainingTerminals.length > 0 ? remainingTerminals[0] : null;
      }
    } catch (error) {
      this.logger.error(`Failed to kill terminal ${terminalId}`, error);
      throw error;
    }
  }

  // Kill all terminals
  killAllTerminals() {
    const terminalIds = Array.from(this.terminals.keys());
    terminalIds.forEach(id => {
      try {
        this.killTerminal(id);
      } catch (error) {
        this.logger.error(`Failed to kill terminal ${id}`, error);
      }
    });
    this.activeTerminalId = null;
    this.logger.info('All terminals killed');
  }

  // Get terminal status
  getTerminalStatus(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return { exists: false };
    }

    return {
      exists: true,
      isActive: terminal.isActive,
      pid: terminal.process.pid,
      createdAt: terminal.createdAt,
      lastActivity: terminal.lastActivity,
    };
  }

  // Get all terminals status
  getAllTerminalsStatus() {
    const status = {};
    for (const [id, terminal] of this.terminals) {
      status[id] = this.getTerminalStatus(id);
    }
    return {
      terminals: status,
      activeTerminalId: this.activeTerminalId,
      count: this.terminals.size,
    };
  }

  // Set active terminal
  setActiveTerminal(terminalId) {
    if (!this.terminals.has(terminalId)) {
      throw new TerminalError(`Terminal ${terminalId} not found`);
    }
    this.activeTerminalId = terminalId;
    this.logger.info(`Active terminal set to ${terminalId}`);
  }

  // Get active terminal
  getActiveTerminal() {
    if (!this.activeTerminalId) {
      return null;
    }
    return this.getTerminal(this.activeTerminalId);
  }

  // Private method to get default shell
  _getDefaultShell() {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'powershell.exe';
      case 'darwin':
      case 'linux':
        return process.env.SHELL || '/bin/zsh';
      default:
        return '/bin/sh';
    }
  }

  // Cleanup method
  cleanup() {
    this.logger.info('Cleaning up terminal manager');
    this.killAllTerminals();
  }
}

module.exports = TerminalManager;
