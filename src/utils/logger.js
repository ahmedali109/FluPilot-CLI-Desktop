/**
 * Logger utility for the application
 */

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;

    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  info(message, data = null) {
    if (this.isDevelopment) {
      console.log(this._formatMessage('INFO', message, data));
    }
  }

  warn(message, data = null) {
    if (this.isDevelopment) {
      console.warn(this._formatMessage('WARN', message, data));
    }
  }

  error(message, error = null) {
    const errorData = error
      ? {
          message: error.message,
          stack: error.stack,
          ...(error.code && { code: error.code }),
        }
      : null;

    console.error(this._formatMessage('ERROR', message, errorData));
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      console.debug(this._formatMessage('DEBUG', message, data));
    }
  }
}

module.exports = Logger;
