/**
 * Auto-update system for the application
 */

const { app, dialog, shell } = require('electron');
const https = require('https');
const semver = require('semver');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');

class UpdateManager {
  constructor(settingsManager) {
    this.logger = new Logger('UpdateManager');
    this.settingsManager = settingsManager;
    // Set to null or a valid repository URL
    this.updateCheckUrl = null; // Disable updates for now - set to 'https://api.github.com/repos/your-username/your-repo/releases/latest' when ready
    this.repositoryConfigured = false;
    this.currentVersion = app.getVersion();
    this.isChecking = false;
    this.autoCheckInterval = null;
  }

  // Initialize update system
  async initialize() {
    const settings = await this.settingsManager.getSettings();

    // Check if a repository is configured in settings
    if (settings.general && settings.general.updateRepository) {
      this.configureRepository(settings.general.updateRepository);
    }

    if (settings.general.autoCheckUpdates && this.repositoryConfigured) {
      this.startAutoCheck();
    }

    this.logger.info(
      `Update manager initialized (current version: ${
        this.currentVersion
      }, repository: ${
        this.repositoryConfigured ? 'configured' : 'not configured'
      })`
    );
  }

  // Start automatic update checking
  startAutoCheck(intervalHours = 24) {
    if (!this.repositoryConfigured) {
      this.logger.info(
        'Cannot start auto-update checking - no repository configured'
      );
      return;
    }

    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }

    this.autoCheckInterval = setInterval(() => {
      this.checkForUpdates(false); // Silent check
    }, intervalHours * 60 * 60 * 1000);

    this.logger.info(
      `Auto-update checking enabled (interval: ${intervalHours}h)`
    );
  }

  // Stop automatic update checking
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
    }
    this.logger.info('Auto-update checking disabled');
  }

  // Check for updates
  async checkForUpdates(showNoUpdateDialog = true) {
    if (this.isChecking) {
      this.logger.debug('Update check already in progress');
      return;
    }

    // Check if repository is configured
    if (!this.updateCheckUrl) {
      this.logger.info(
        'Update checking is disabled - no repository configured'
      );
      if (showNoUpdateDialog) {
        await this._showRepositoryNotConfiguredDialog();
      }
      return;
    }

    this.isChecking = true;

    try {
      this.logger.info('Checking for updates...');

      const latestRelease = await this._fetchLatestRelease();
      const latestVersion = latestRelease.tag_name.replace(/^v/, ''); // Remove 'v' prefix

      // Validate version format
      if (!semver.valid(latestVersion)) {
        throw new Error(`Invalid version format in release: ${latestVersion}`);
      }

      if (!semver.valid(this.currentVersion)) {
        throw new Error(
          `Invalid current version format: ${this.currentVersion}`
        );
      }

      if (semver.gt(latestVersion, this.currentVersion)) {
        this.logger.info(
          `Update available: ${latestVersion} (current: ${this.currentVersion})`
        );
        await this._showUpdateDialog(latestRelease);
      } else {
        this.logger.info('Application is up to date');
        if (showNoUpdateDialog) {
          await this._showNoUpdateDialog();
        }
      }

      // Update last check time
      await this.settingsManager.setSetting(
        'general.lastUpdateCheck',
        new Date().toISOString()
      );
    } catch (error) {
      this.logger.error('Failed to check for updates', error);
      if (showNoUpdateDialog) {
        await this._showUpdateErrorDialog(error);
      }
    } finally {
      this.isChecking = false;
    }
  }

  // Fetch latest release from GitHub API
  _fetchLatestRelease() {
    return new Promise((resolve, reject) => {
      if (!this.updateCheckUrl) {
        reject(new Error('Update repository not configured'));
        return;
      }

      const url = new URL(this.updateCheckUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'User-Agent': `FluPilot-CLI/${this.currentVersion}`,
          Accept: 'application/vnd.github.v3+json',
        },
      };

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const release = JSON.parse(data);

              // Validate required fields
              if (!release.tag_name) {
                reject(new Error('Invalid release data: missing tag_name'));
                return;
              }

              if (!Array.isArray(release.assets)) {
                reject(
                  new Error('Invalid release data: missing or invalid assets')
                );
                return;
              }

              resolve(release);
            } else if (res.statusCode === 404) {
              reject(
                new Error('Repository not found or no releases available')
              );
            } else if (res.statusCode === 403) {
              reject(new Error('Rate limit exceeded or access denied'));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // Show update available dialog
  async _showUpdateDialog(release) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `FluPilot CLI ${release.tag_name} is available`,
      detail: `You are currently running version ${
        this.currentVersion
      }.\n\nRelease Notes:\n${release.body || 'No release notes available.'}`,
      buttons: ['Download Update', 'View Release Page', 'Remind Me Later'],
      defaultId: 0,
      cancelId: 2,
    });

    switch (result.response) {
      case 0: // Download Update
        await this._downloadUpdate(release);
        break;
      case 1: // View Release Page
        shell.openExternal(release.html_url);
        break;
      case 2: // Remind Me Later
        // Do nothing
        break;
    }
  }

  // Show no update available dialog
  async _showNoUpdateDialog() {
    await dialog.showMessageBox({
      type: 'info',
      title: 'No Updates Available',
      message: 'You are running the latest version of FluPilot CLI',
      detail: `Current version: ${this.currentVersion}`,
      buttons: ['OK'],
    });
  }

  // Show update error dialog
  async _showUpdateErrorDialog(error) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Update Check Failed',
      message: 'Failed to check for updates',
      detail: `Error: ${error.message}\n\nPlease check your internet connection and try again.`,
      buttons: ['OK'],
    });
  }

  // Show repository not configured dialog
  async _showRepositoryNotConfiguredDialog() {
    await dialog.showMessageBox({
      type: 'info',
      title: 'Updates Not Available',
      message: 'Update checking is currently disabled',
      detail: `You are running version ${this.currentVersion}.\n\nAutomatic updates are not configured for this installation. Updates must be downloaded manually from the official source.`,
      buttons: ['OK'],
    });
  }

  // Download update (simplified - in real implementation you'd want to download and verify)
  async _downloadUpdate(release) {
    try {
      // Validate release object
      if (!release || !Array.isArray(release.assets)) {
        throw new Error('Invalid release data');
      }

      // Find the appropriate asset for the current platform
      const platform = process.platform;
      const asset = this._findAssetForPlatform(release.assets, platform);

      if (!asset) {
        throw new Error(`No update available for platform: ${platform}`);
      }

      // Validate asset object
      if (
        !asset.browser_download_url ||
        !asset.name ||
        typeof asset.size !== 'number'
      ) {
        throw new Error('Invalid asset data');
      }

      const result = await dialog.showMessageBox({
        type: 'question',
        title: 'Download Update',
        message: 'Download and install update?',
        detail: `This will download ${asset.name} (${this._formatBytes(
          asset.size
        )}) and open it for installation.`,
        buttons: ['Download', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
      });

      if (result.response === 0) {
        // Open the download URL in the default browser
        shell.openExternal(asset.browser_download_url);

        // Optionally quit the app after showing instructions
        const quitResult = await dialog.showMessageBox({
          type: 'question',
          title: 'Install Update',
          message: 'Download started',
          detail:
            'The update will be downloaded by your browser. Please install it and restart the application.\n\nWould you like to quit the application now?',
          buttons: ['Quit Now', 'Continue Running'],
          defaultId: 0,
          cancelId: 1,
        });

        if (quitResult.response === 0) {
          app.quit();
        }
      }
    } catch (error) {
      this.logger.error('Failed to download update', error);
      await dialog.showMessageBox({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download update',
        detail: error.message,
        buttons: ['OK'],
      });
    }
  }

  // Find appropriate asset for current platform
  _findAssetForPlatform(assets, platform) {
    const platformMap = {
      darwin: ['.dmg', '-mac', '-macos'],
      win32: ['.exe', '-win', '-windows'],
      linux: ['.AppImage', '.deb', '.rpm', '-linux'],
    };

    const platformKeywords = platformMap[platform] || [];

    return assets.find(asset => {
      const name = asset.name.toLowerCase();
      return platformKeywords.some(keyword => name.includes(keyword));
    });
  }

  // Format bytes to human readable
  _formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Get update status
  getUpdateStatus() {
    return {
      currentVersion: this.currentVersion,
      isChecking: this.isChecking,
      autoCheckEnabled: this.autoCheckInterval !== null,
      lastCheck: this.settingsManager.getSetting('general.lastUpdateCheck'),
    };
  }

  // Enable/disable auto-updates
  async setAutoUpdates(enabled) {
    await this.settingsManager.setSetting('general.autoCheckUpdates', enabled);

    if (enabled) {
      this.startAutoCheck();
    } else {
      this.stopAutoCheck();
    }

    this.logger.info(`Auto-updates ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Configure update repository
  configureRepository(githubRepo) {
    if (githubRepo && typeof githubRepo === 'string') {
      // Validate the repository format (owner/repo)
      const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
      if (repoPattern.test(githubRepo.trim())) {
        this.updateCheckUrl = `https://api.github.com/repos/${githubRepo.trim()}/releases/latest`;
        this.repositoryConfigured = true;
        this.logger.info(`Update repository configured: ${githubRepo}`);
      } else {
        this.logger.error(
          'Invalid repository format. Use format: owner/repo (alphanumeric, dots, dashes, underscores only)'
        );
        this.updateCheckUrl = null;
        this.repositoryConfigured = false;
      }
    } else {
      this.updateCheckUrl = null;
      this.repositoryConfigured = false;
      this.logger.info('Update repository disabled');
    }
  }

  // Cleanup
  cleanup() {
    this.stopAutoCheck();
  }
}

module.exports = UpdateManager;
