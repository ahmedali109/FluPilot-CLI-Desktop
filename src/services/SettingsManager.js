/**
 * Settings and configuration management
 */

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const Logger = require('../utils/logger');

class SettingsManager {
  constructor() {
    this.logger = new Logger('SettingsManager');
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.defaultSettings = {
      terminal: {
        fontSize: 14,
        fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
        theme: 'default',
        scrollback: 1000,
        cursorBlink: true,
        cursorStyle: 'block',
        lineHeight: 1.2,
      },
      window: {
        width: 1200,
        height: 800,
        x: undefined,
        y: undefined,
        maximized: false,
      },
      general: {
        autoCheckUpdates: true,
        showNotifications: true,
        confirmExit: true,
        defaultShell: null, // Will be auto-detected
      },
      theme: {
        current: 'default',
        custom: null,
      },
      shortcuts: {
        newTerminal: 'CmdOrCtrl+T',
        killTerminal: 'CmdOrCtrl+K',
        clearTerminal: 'CmdOrCtrl+L',
        toggleFullscreen: 'F11',
      },
    };
    this.settings = { ...this.defaultSettings };
  }

  // Load settings from file
  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');

      // Check if file is empty or contains only whitespace
      if (!data.trim()) {
        this.logger.info('Settings file is empty, creating with defaults');
        await this.saveSettings();
        return this.settings;
      }

      const loadedSettings = JSON.parse(data);

      // Merge with defaults to ensure all properties exist
      this.settings = this._mergeSettings(this.defaultSettings, loadedSettings);

      this.logger.info('Settings loaded successfully');
      return this.settings;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('Settings file not found, creating with defaults');
        await this.saveSettings();
        return this.settings;
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        this.logger.warn(
          'Settings file is corrupted, recreating with defaults',
          error
        );
        // Reset to defaults and save
        this.settings = { ...this.defaultSettings };
        await this.saveSettings();
        return this.settings;
      }

      this.logger.error('Failed to load settings', error);
      throw error;
    }
  }

  // Save settings to file
  async saveSettings() {
    try {
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2)
      );
      this.logger.info('Settings saved successfully');
    } catch (error) {
      this.logger.error('Failed to save settings', error);
      throw error;
    }
  }

  // Get all settings
  getSettings() {
    return { ...this.settings };
  }

  // Get specific setting
  getSetting(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  // Set specific setting
  async setSetting(key, value) {
    const keys = key.split('.');
    let current = this.settings;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    // Set the value
    current[keys[keys.length - 1]] = value;

    // Save to file
    await this.saveSettings();

    this.logger.info(`Setting ${key} updated`, { value });
  }

  // Update multiple settings at once
  async updateSettings(newSettings) {
    this.settings = this._mergeSettings(this.settings, newSettings);
    await this.saveSettings();
    this.logger.info('Multiple settings updated');
  }

  // Reset to defaults
  async resetSettings() {
    this.settings = { ...this.defaultSettings };
    await this.saveSettings();
    this.logger.info('Settings reset to defaults');
  }

  // Reset specific section
  async resetSection(section) {
    if (section in this.defaultSettings) {
      this.settings[section] = { ...this.defaultSettings[section] };
      await this.saveSettings();
      this.logger.info(`Settings section '${section}' reset to defaults`);
    }
  }

  // Export settings
  async exportSettings(filePath) {
    try {
      await fs.writeFile(filePath, JSON.stringify(this.settings, null, 2));
      this.logger.info(`Settings exported to ${filePath}`);
    } catch (error) {
      this.logger.error('Failed to export settings', error);
      throw error;
    }
  }

  // Import settings
  async importSettings(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const importedSettings = JSON.parse(data);

      // Validate imported settings
      this.settings = this._mergeSettings(
        this.defaultSettings,
        importedSettings
      );
      await this.saveSettings();

      this.logger.info(`Settings imported from ${filePath}`);
    } catch (error) {
      this.logger.error('Failed to import settings', error);
      throw error;
    }
  }

  // Private method to deep merge settings
  _mergeSettings(defaults, custom) {
    const result = { ...defaults };

    for (const key in custom) {
      if (custom.hasOwnProperty(key)) {
        if (
          typeof custom[key] === 'object' &&
          custom[key] !== null &&
          !Array.isArray(custom[key]) &&
          typeof defaults[key] === 'object' &&
          defaults[key] !== null &&
          !Array.isArray(defaults[key])
        ) {
          result[key] = this._mergeSettings(defaults[key], custom[key]);
        } else {
          result[key] = custom[key];
        }
      }
    }

    return result;
  }

  // Get settings file path
  getSettingsPath() {
    return this.settingsPath;
  }
}

module.exports = SettingsManager;
