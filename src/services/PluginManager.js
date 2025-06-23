/**
 * Plugin system for extensibility
 */

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const Logger = require('../utils/logger');

class PluginManager {
  constructor() {
    this.logger = new Logger('PluginManager');
    this.plugins = new Map();
    this.hooks = new Map();
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    this.enabledPlugins = new Set();
  }

  // Initialize plugin system
  async initialize() {
    try {
      // Ensure plugins directory exists
      await fs.mkdir(this.pluginsDir, { recursive: true });

      // Load plugin configurations
      await this.loadPluginConfigs();

      // Load enabled plugins
      await this.loadEnabledPlugins();

      this.logger.info('Plugin system initialized');
    } catch (error) {
      this.logger.error('Failed to initialize plugin system', error);
    }
  }

  // Register a plugin
  registerPlugin(pluginInfo) {
    const { id, name, version, main, hooks = [], commands = [] } = pluginInfo;

    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }

    const plugin = {
      id,
      name,
      version,
      main,
      hooks,
      commands,
      enabled: false,
      instance: null,
    };

    this.plugins.set(id, plugin);
    this.logger.info(`Plugin registered: ${name} (${id})`);

    return plugin;
  }

  // Enable a plugin
  async enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.enabled) {
      return; // Already enabled
    }

    try {
      // Load plugin main file
      if (plugin.main) {
        const pluginPath = path.join(this.pluginsDir, pluginId, plugin.main);
        delete require.cache[require.resolve(pluginPath)]; // Clear cache
        const PluginClass = require(pluginPath);
        plugin.instance = new PluginClass(this);

        // Initialize plugin
        if (typeof plugin.instance.initialize === 'function') {
          await plugin.instance.initialize();
        }
      }

      // Register plugin hooks
      for (const hook of plugin.hooks) {
        this.registerHook(hook, pluginId);
      }

      plugin.enabled = true;
      this.enabledPlugins.add(pluginId);

      this.logger.info(`Plugin enabled: ${plugin.name}`);
    } catch (error) {
      this.logger.error(`Failed to enable plugin ${pluginId}`, error);
      throw error;
    }
  }

  // Disable a plugin
  async disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      return;
    }

    try {
      // Cleanup plugin
      if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
        await plugin.instance.cleanup();
      }

      // Unregister hooks
      for (const hook of plugin.hooks) {
        this.unregisterHook(hook, pluginId);
      }

      plugin.enabled = false;
      plugin.instance = null;
      this.enabledPlugins.delete(pluginId);

      this.logger.info(`Plugin disabled: ${plugin.name}`);
    } catch (error) {
      this.logger.error(`Failed to disable plugin ${pluginId}`, error);
      throw error;
    }
  }

  // Register a hook
  registerHook(hookName, pluginId) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }
    this.hooks.get(hookName).add(pluginId);
  }

  // Unregister a hook
  unregisterHook(hookName, pluginId) {
    if (this.hooks.has(hookName)) {
      this.hooks.get(hookName).delete(pluginId);
    }
  }

  // Execute hooks
  async executeHook(hookName, data = {}) {
    const plugins = this.hooks.get(hookName);
    if (!plugins) {
      return data;
    }

    let result = data;
    for (const pluginId of plugins) {
      const plugin = this.plugins.get(pluginId);
      if (plugin && plugin.enabled && plugin.instance) {
        try {
          const hookMethod = `on${hookName
            .charAt(0)
            .toUpperCase()}${hookName.slice(1)}`;
          if (typeof plugin.instance[hookMethod] === 'function') {
            result = (await plugin.instance[hookMethod](result)) || result;
          }
        } catch (error) {
          this.logger.error(
            `Hook ${hookName} failed for plugin ${pluginId}`,
            error
          );
        }
      }
    }

    return result;
  }

  // Install plugin from directory
  async installPlugin(sourcePath) {
    try {
      const packagePath = path.join(sourcePath, 'package.json');
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));

      const pluginId = packageData.name;
      const targetPath = path.join(this.pluginsDir, pluginId);

      // Copy plugin files
      await this.copyDirectory(sourcePath, targetPath);

      // Register plugin
      this.registerPlugin({
        id: pluginId,
        name: packageData.displayName || packageData.name,
        version: packageData.version,
        main: packageData.main,
        hooks: packageData.fluPilotHooks || [],
        commands: packageData.fluPilotCommands || [],
      });

      this.logger.info(`Plugin installed: ${pluginId}`);
      return pluginId;
    } catch (error) {
      this.logger.error('Failed to install plugin', error);
      throw error;
    }
  }

  // Uninstall plugin
  async uninstallPlugin(pluginId) {
    try {
      // Disable plugin first
      await this.disablePlugin(pluginId);

      // Remove plugin files
      const pluginPath = path.join(this.pluginsDir, pluginId);
      await fs.rmdir(pluginPath, { recursive: true });

      // Unregister plugin
      this.plugins.delete(pluginId);

      this.logger.info(`Plugin uninstalled: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Failed to uninstall plugin ${pluginId}`, error);
      throw error;
    }
  }

  // Get plugin list
  getPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      enabled: plugin.enabled,
      hooks: plugin.hooks,
      commands: plugin.commands,
    }));
  }

  // Load plugin configurations
  async loadPluginConfigs() {
    try {
      const entries = await fs.readdir(this.pluginsDir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginId = entry.name;
          const packagePath = path.join(
            this.pluginsDir,
            pluginId,
            'package.json'
          );

          try {
            const packageData = JSON.parse(
              await fs.readFile(packagePath, 'utf8')
            );
            this.registerPlugin({
              id: pluginId,
              name: packageData.displayName || packageData.name,
              version: packageData.version,
              main: packageData.main,
              hooks: packageData.fluPilotHooks || [],
              commands: packageData.fluPilotCommands || [],
            });
          } catch (error) {
            this.logger.warn(
              `Failed to load plugin config for ${pluginId}`,
              error
            );
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load plugin configs', error);
      }
    }
  }

  // Load enabled plugins
  async loadEnabledPlugins() {
    const configPath = path.join(this.pluginsDir, 'enabled.json');
    try {
      const data = await fs.readFile(configPath, 'utf8');
      const enabledList = JSON.parse(data);

      for (const pluginId of enabledList) {
        if (this.plugins.has(pluginId)) {
          await this.enablePlugin(pluginId);
        }
      }
    } catch (error) {
      // File doesn't exist, that's okay
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load enabled plugins', error);
      }
    }
  }

  // Save enabled plugins list
  async saveEnabledPlugins() {
    const configPath = path.join(this.pluginsDir, 'enabled.json');
    const enabledList = Array.from(this.enabledPlugins);

    try {
      await fs.writeFile(configPath, JSON.stringify(enabledList, null, 2));
    } catch (error) {
      this.logger.error('Failed to save enabled plugins', error);
    }
  }

  // Utility to copy directory recursively
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  // Cleanup
  async cleanup() {
    for (const pluginId of this.enabledPlugins) {
      await this.disablePlugin(pluginId);
    }
    await this.saveEnabledPlugins();
  }
}

module.exports = PluginManager;
