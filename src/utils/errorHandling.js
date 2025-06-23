/**
 * Enhanced error handling and validation utilities
 */

class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

class TerminalError extends AppError {
  constructor(message, details = null) {
    super(message, 'TERMINAL_ERROR', details);
    this.name = 'TerminalError';
  }
}

// Error handler wrapper for async functions
function asyncErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AppError(
        `Unexpected error: ${error.message}`,
        'UNEXPECTED_ERROR',
        { originalError: error.message, stack: error.stack }
      );
    }
  };
}

// Validation utilities
const validators = {
  isValidCommand: command => {
    if (typeof command !== 'string') return false;
    if (command.trim().length === 0) return false;
    // Check for potentially dangerous commands
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // Dangerous rm commands
      />\s*\/dev\/sda/, // Direct disk writes
      /sudo\s+rm/, // Sudo rm commands
    ];
    return !dangerousPatterns.some(pattern => pattern.test(command));
  },

  isValidPath: path => {
    if (typeof path !== 'string') return false;
    // Basic path validation - you might want to expand this
    return path.trim().length > 0 && !path.includes('..'); // Prevent directory traversal
  },

  isValidTerminalSize: (cols, rows) => {
    return (
      Number.isInteger(cols) &&
      Number.isInteger(rows) &&
      cols > 0 &&
      rows > 0 &&
      cols <= 500 &&
      rows <= 200
    );
  },
};

module.exports = {
  AppError,
  ValidationError,
  TerminalError,
  asyncErrorHandler,
  validators,
};
