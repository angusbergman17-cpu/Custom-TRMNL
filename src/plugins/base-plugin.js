/**
 * Base Plugin Class
 * All data source plugins extend this to ensure consistent interface
 */

class BasePlugin {
  constructor(config = {}) {
    this.config = config;
    this.enabled = config.enabled !== false;
    this.refreshInterval = config.refreshInterval || 900000; // Default 15 min
    this.cache = null;
    this.lastFetch = null;
  }

  /**
   * Fetch fresh data from the source
   * Override this in child plugins
   */
  async fetchData() {
    throw new Error('fetchData() must be implemented by plugin');
  }

  /**
   * Get cached data if available and fresh
   */
  async getCached() {
    if (!this.cache || this.isCacheStale()) {
      return null;
    }
    return this.cache;
  }

  /**
   * Get data (cached or fresh)
   */
  async getData() {
    if (!this.enabled) {
      return null;
    }

    const cached = await this.getCached();
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchData();
      this.cache = data;
      this.lastFetch = Date.now();
      return data;
    } catch (error) {
      console.error(`[${this.constructor.name}] Error fetching data:`, error.message);
      return this.cache; // Return stale cache on error
    }
  }

  /**
   * Check if cache is stale
   */
  isCacheStale() {
    if (!this.lastFetch) return true;
    return Date.now() - this.lastFetch > this.refreshInterval;
  }

  /**
   * Validate data structure
   * Override for custom validation
   */
  validate(data) {
    return data !== null && data !== undefined;
  }

  /**
   * Force refresh
   */
  async refresh() {
    this.cache = null;
    this.lastFetch = null;
    return this.getData();
  }

  /**
   * Get plugin metadata
   */
  getInfo() {
    return {
      name: this.constructor.name,
      enabled: this.enabled,
      refreshInterval: this.refreshInterval,
      lastFetch: this.lastFetch,
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null
    };
  }
}

module.exports = BasePlugin;
