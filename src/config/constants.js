/**
 * Application constants and configuration
 */

const APP_CONFIG = {
  NAME: 'FluPilot CLI',
  VERSION: '1.0.0',
  AUTHOR: 'Ahmed Ali',
  DESCRIPTION:
    'A terminal application built with Electron, node-pty, and xterm.js',

  // Window settings
  WINDOW: {
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
  },

  // Terminal settings
  TERMINAL: {
    DEFAULT_COLS: 80,
    DEFAULT_ROWS: 24,
    SCROLLBACK: 1000,
    FONT_SIZE: 14,
    FONT_FAMILY: '"Menlo", "Monaco", "Courier New", monospace',
  },

  // Paths
  PATHS: {
    PRELOAD: 'preload.js',
    TERMINAL_PAGE: 'index.html',
    FLUTTER_EXPLORER: 'flutter_explorer.html',
    ICON: 'assets/Icon.png',
  },

  // Environment
  IS_DEVELOPMENT:
    process.env.NODE_ENV === 'development' ||
    process.argv.includes('--dev') ||
    process.argv.includes('--development'),
};

// Theme configurations
const THEMES = {
  DEFAULT: {
    background: '#1e1e1e',
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
};

module.exports = {
  APP_CONFIG,
  THEMES,
};
