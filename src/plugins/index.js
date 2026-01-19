const WeatherPlugin = require('./weather');
const CalendarPlugin = require('./calendar');
const NewsPlugin = require('./news');
const CustomPlugin = require('./custom');

/**
 * Plugin Manager
 * Coordinates all data source plugins
 */
class PluginManager {
  constructor(config = {}) {
    this.plugins = {};
    
    // Initialize plugins from config
    if (config.weather) {
      this.plugins.weather = new WeatherPlugin(config.weather);
    }
    
    if (config.calendar) {
      this.plugins.calendar = new CalendarPlugin(config.calendar);
    }
    
    if (config.news) {
      this.plugins.news = new NewsPlugin(config.news);
    }
    
    if (config.custom) {
      this.plugins.custom = new CustomPlugin(config.custom);
    }
  }

  /**
   * Get data from all enabled plugins
   */
  async getAllData() {
    const data = {};
    const promises = [];

    for (const [name, plugin] of Object.entries(this.plugins)) {
      if (plugin.enabled) {
        promises.push(
          plugin.getData()
            .then(result => { data[name] = result; })
            .catch(error => {
              console.error(`[PluginManager] Error getting data from ${name}:`, error.message);
              data[name] = null;
            })
        );
      }
    }

    await Promise.all(promises);
    return data;
  }

  /**
   * Get data from specific plugin
   */
  async getPluginData(pluginName) {
    const plugin = this.plugins[pluginName];
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    return plugin.getData();
  }

  /**
   * Force refresh specific plugin
   */
  async refreshPlugin(pluginName) {
    const plugin = this.plugins[pluginName];
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    return plugin.refresh();
  }

  /**
   * Force refresh all plugins
   */
  async refreshAll() {
    const promises = Object.values(this.plugins).map(plugin => 
      plugin.refresh().catch(err => {
        console.error(`Error refreshing plugin:`, err);
        return null;
      })
    );
    return Promise.all(promises);
  }

  /**
   * Get status of all plugins
   */
  getStatus() {
    const status = {};
    for (const [name, plugin] of Object.entries(this.plugins)) {
      status[name] = plugin.getInfo();
    }
    return status;
  }

  /**
   * Enable/disable plugin
   */
  setPluginEnabled(pluginName, enabled) {
    const plugin = this.plugins[pluginName];
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    plugin.enabled = enabled;
  }
}

module.exports = PluginManager;
