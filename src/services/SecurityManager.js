/**
 * Security configuration and utilities
 */

const crypto = require('crypto');
const { app, session } = require('electron');
const Logger = require('../utils/logger');

class SecurityManager {
  constructor() {
    this.logger = new Logger('SecurityManager');
    this.trustedHosts = new Set(['localhost', '127.0.0.1']);
    this.encryptionKey = this._generateEncryptionKey();
  }

  // Initialize security settings
  initialize() {
    this._setupCSP();
    this._setupPermissions();
    this._setupCertificateVerification();
    this.logger.info('Security manager initialized');
  }

  // Setup Content Security Policy
  _setupCSP() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' data:; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' ws: wss:;",
          ],
        },
      });
    });
  }

  // Setup permission handling
  _setupPermissions() {
    session.defaultSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        // Deny most permissions by default
        const deniedPermissions = [
          'camera',
          'microphone',
          'geolocation',
          'notifications',
          'pointerLock',
          'fullscreen',
        ];

        if (deniedPermissions.includes(permission)) {
          this.logger.warn(`Permission denied: ${permission}`);
          callback(false);
        } else {
          callback(true);
        }
      }
    );
  }

  // Setup certificate verification
  _setupCertificateVerification() {
    app.on(
      'certificate-error',
      (event, webContents, url, error, certificate, callback) => {
        // For development, you might want to bypass certificate errors for localhost
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isLocalhost =
          url.startsWith('https://localhost') ||
          url.startsWith('https://127.0.0.1');

        if (isDevelopment && isLocalhost) {
          event.preventDefault();
          callback(true);
          this.logger.warn(
            `Certificate error bypassed for development: ${url}`
          );
        } else {
          this.logger.error(`Certificate error: ${error} for ${url}`);
          callback(false);
        }
      }
    );
  }

  // Validate URL for safety
  isUrlSafe(url) {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:', 'file:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check for trusted hosts
      if (
        urlObj.protocol !== 'file:' &&
        !this.trustedHosts.has(urlObj.hostname)
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Sanitize command for safe execution
  sanitizeCommand(command) {
    if (typeof command !== 'string') {
      throw new Error('Command must be a string');
    }

    // Remove potential command injection characters
    const dangerous = /[;&|`$<>]/g;
    if (dangerous.test(command)) {
      throw new Error('Command contains potentially dangerous characters');
    }

    return command.trim();
  }

  // Encrypt sensitive data
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Generate encryption key
  _generateEncryptionKey() {
    // In production, this should be stored securely
    return crypto.randomBytes(32).toString('hex');
  }

  // Add trusted host
  addTrustedHost(hostname) {
    this.trustedHosts.add(hostname);
    this.logger.info(`Added trusted host: ${hostname}`);
  }

  // Remove trusted host
  removeTrustedHost(hostname) {
    this.trustedHosts.delete(hostname);
    this.logger.info(`Removed trusted host: ${hostname}`);
  }

  // Get security report
  getSecurityReport() {
    return {
      trustedHosts: Array.from(this.trustedHosts),
      cspEnabled: true,
      permissionsRestricted: true,
      certificateValidation: true,
    };
  }
}

module.exports = SecurityManager;
