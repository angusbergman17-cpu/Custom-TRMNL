const cron = require('node-cron');

/**
 * Refresh Manager
 * Handles scheduled refreshes and layout rotation
 */
class RefreshManager {
  constructor(pluginManager, layoutEngine, config = {}) {
    this.pluginManager = pluginManager;
    this.layoutEngine = layoutEngine;
    this.config = config;
    
    // Rotation settings
    this.rotationEnabled = config.rotation?.enabled || false;
    this.rotationLayouts = config.rotation?.layouts || ['dashboard', 'focus-weather', 'focus-calendar', 'focus-news'];
    this.rotationInterval = config.rotation?.interval || 300000; // 5 minutes
    this.currentRotationIndex = 0;
    
    // Refresh settings
    this.refreshInterval = config.refreshInterval || 300000; // 5 minutes
    
    // Timers
    this.refreshTimer = null;
    this.rotationTimer = null;
    
    // State
    this.lastRefresh = null;
    this.lastImage = null;
  }

  /**
   * Start automatic refresh
   */
  startRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    console.log(`[RefreshManager] Starting auto-refresh every ${this.refreshInterval / 1000}s`);
    
    // Initial refresh
    this.refresh();
    
    // Schedule periodic refresh
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.refreshInterval);
  }

  /**
   * Stop automatic refresh
   */
  stopRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[RefreshManager] Auto-refresh stopped');
    }
  }

  /**
   * Perform refresh
   */
  async refresh() {
    try {
      console.log('[RefreshManager] Refreshing data and rendering...');
      
      // Get fresh data from all plugins
      const data = await this.pluginManager.getAllData();
      
      // Render current layout
      const currentLayout = this.rotationEnabled 
        ? this.rotationLayouts[this.currentRotationIndex]
        : this.layoutEngine.currentLayout;
      
      const image = await this.layoutEngine.render(data, currentLayout);
      
      this.lastImage = image;
      this.lastRefresh = new Date();
      
      console.log(`[RefreshManager] Refresh complete - Layout: ${currentLayout}`);
      
      return image;
    } catch (error) {
      console.error('[RefreshManager] Error during refresh:', error);
      throw error;
    }
  }

  /**
   * Start layout rotation
   */
  startRotation() {
    if (!this.rotationEnabled) {
      console.log('[RefreshManager] Rotation not enabled in config');
      return;
    }

    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    console.log(`[RefreshManager] Starting layout rotation every ${this.rotationInterval / 1000}s`);
    console.log(`[RefreshManager] Rotation layouts: ${this.rotationLayouts.join(', ')}`);
    
    this.rotationTimer = setInterval(() => {
      this.rotateLayout();
    }, this.rotationInterval);
  }

  /**
   * Stop layout rotation
   */
  stopRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('[RefreshManager] Layout rotation stopped');
    }
  }

  /**
   * Rotate to next layout
   */
  async rotateLayout() {
    this.currentRotationIndex = (this.currentRotationIndex + 1) % this.rotationLayouts.length;
    const nextLayout = this.rotationLayouts[this.currentRotationIndex];
    
    console.log(`[RefreshManager] Rotating to layout: ${nextLayout}`);
    
    // Trigger refresh with new layout
    return this.refresh();
  }

  /**
   * Get last rendered image
   */
  getLastImage() {
    return this.lastImage;
  }

  /**
   * Get refresh status
   */
  getStatus() {
    return {
      refreshEnabled: !!this.refreshTimer,
      refreshInterval: this.refreshInterval,
      lastRefresh: this.lastRefresh,
      rotationEnabled: this.rotationEnabled && !!this.rotationTimer,
      rotationInterval: this.rotationInterval,
      rotationLayouts: this.rotationLayouts,
      currentLayout: this.rotationLayouts[this.currentRotationIndex],
      currentRotationIndex: this.currentRotationIndex
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    const wasRotating = !!this.rotationTimer;
    const wasRefreshing = !!this.refreshTimer;

    // Stop timers
    this.stopRefresh();
    this.stopRotation();

    // Update config
    if (newConfig.refreshInterval) {
      this.refreshInterval = newConfig.refreshInterval;
    }
    if (newConfig.rotation) {
      this.rotationEnabled = newConfig.rotation.enabled !== false;
      if (newConfig.rotation.layouts) {
        this.rotationLayouts = newConfig.rotation.layouts;
      }
      if (newConfig.rotation.interval) {
        this.rotationInterval = newConfig.rotation.interval;
      }
    }

    // Restart if they were running
    if (wasRefreshing) {
      this.startRefresh();
    }
    if (wasRotating && this.rotationEnabled) {
      this.startRotation();
    }

    console.log('[RefreshManager] Configuration updated');
  }

  /**
   * Start all schedulers
   */
  start() {
    this.startRefresh();
    if (this.rotationEnabled) {
      this.startRotation();
    }
  }

  /**
   * Stop all schedulers
   */
  stop() {
    this.stopRefresh();
    this.stopRotation();
  }
}

module.exports = RefreshManager;
