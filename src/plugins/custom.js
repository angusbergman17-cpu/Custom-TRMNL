const BasePlugin = require('./base-plugin');
const axios = require('axios');

/**
 * Custom API Plugin
 * Fetches data from user-defined API endpoints
 */
class CustomPlugin extends BasePlugin {
  constructor(config = {}) {
    super(config);
    this.endpoints = config.endpoints || [];
    this.headers = config.headers || {};
    
    if (!this.endpoints.length) {
      console.warn('[CustomPlugin] No endpoints configured. Plugin disabled.');
      this.enabled = false;
    }
  }

  async fetchData() {
    if (!this.endpoints.length) {
      throw new Error('No custom API endpoints configured');
    }

    const results = [];

    for (const endpoint of this.endpoints) {
      try {
        const response = await axios.get(endpoint.url, {
          headers: { ...this.headers, ...endpoint.headers },
          timeout: endpoint.timeout || 10000
        });

        results.push({
          name: endpoint.name || endpoint.url,
          data: response.data,
          status: 'success'
        });
      } catch (error) {
        console.error(`[CustomPlugin] Error fetching ${endpoint.url}:`, error.message);
        results.push({
          name: endpoint.name || endpoint.url,
          data: null,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      results,
      timestamp: new Date().toISOString()
    };
  }

  validate(data) {
    return data && Array.isArray(data.results);
  }
}

module.exports = CustomPlugin;
