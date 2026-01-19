const express = require('express');
const router = express.Router();
const path = require('path');

/**
 * Initialize routes with dependencies
 */
function initializeRoutes(pluginManager, layoutEngine, refreshManager) {
  
  /**
   * GET /api/screen
   * Returns current screen image for TRMNL device
   */
  router.get('/screen', async (req, res) => {
    try {
      const image = refreshManager.getLastImage();
      
      if (!image) {
        // If no cached image, generate one now
        await refreshManager.refresh();
        const newImage = refreshManager.getLastImage();
        if (!newImage) {
          return res.status(500).json({ error: 'Failed to generate image' });
        }
        const buffer = await newImage.toBuffer();
        return res.type('png').send(buffer);
      }

      const buffer = await image.toBuffer();
      res.type('png').send(buffer);
    } catch (error) {
      console.error('[API] Error serving screen:', error);
      res.status(500).json({ error: 'Failed to generate screen image', details: error.message });
    }
  });

  /**
   * POST /api/refresh
   * Trigger manual refresh
   */
  router.post('/refresh', async (req, res) => {
    try {
      await refreshManager.refresh();
      res.json({ 
        success: true, 
        message: 'Screen refreshed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[API] Error refreshing:', error);
      res.status(500).json({ error: 'Failed to refresh screen' });
    }
  });

  /**
   * GET /api/status
   * Get current system status
   */
  router.get('/status', (req, res) => {
    try {
      const status = {
        plugins: pluginManager.getStatus(),
        refresh: refreshManager.getStatus(),
        layout: {
          current: layoutEngine.currentLayout,
          available: ['dashboard', 'focus-weather', 'focus-calendar', 'focus-news']
        },
        timestamp: new Date().toISOString()
      };
      res.json(status);
    } catch (error) {
      console.error('[API] Error getting status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  /**
   * GET /api/data
   * Get raw data from all plugins
   */
  router.get('/data', async (req, res) => {
    try {
      const data = await pluginManager.getAllData();
      res.json(data);
    } catch (error) {
      console.error('[API] Error getting data:', error);
      res.status(500).json({ error: 'Failed to get data' });
    }
  });

  /**
   * GET /api/data/:plugin
   * Get data from specific plugin
   */
  router.get('/data/:plugin', async (req, res) => {
    try {
      const data = await pluginManager.getPluginData(req.params.plugin);
      res.json(data);
    } catch (error) {
      console.error(`[API] Error getting ${req.params.plugin} data:`, error);
      res.status(500).json({ error: `Failed to get ${req.params.plugin} data` });
    }
  });

  /**
   * POST /api/layout
   * Change current layout
   */
  router.post('/layout', (req, res) => {
    try {
      const { layout } = req.body;
      if (!layout) {
        return res.status(400).json({ error: 'Layout name required' });
      }
      
      layoutEngine.setLayout(layout);
      
      // Trigger refresh with new layout
      refreshManager.refresh().then(() => {
        res.json({ 
          success: true, 
          layout,
          message: 'Layout changed and screen refreshed'
        });
      });
    } catch (error) {
      console.error('[API] Error changing layout:', error);
      res.status(500).json({ error: 'Failed to change layout' });
    }
  });

  /**
   * POST /api/rotation
   * Control rotation settings
   */
  router.post('/rotation', (req, res) => {
    try {
      const { enabled, interval, layouts } = req.body;
      
      const config = {};
      if (enabled !== undefined) {
        config.rotation = { enabled };
      }
      if (interval) {
        config.rotation = { ...config.rotation, interval };
      }
      if (layouts) {
        config.rotation = { ...config.rotation, layouts };
      }

      refreshManager.updateConfig(config);
      
      res.json({ 
        success: true,
        rotation: refreshManager.getStatus()
      });
    } catch (error) {
      console.error('[API] Error updating rotation:', error);
      res.status(500).json({ error: 'Failed to update rotation' });
    }
  });

  /**
   * POST /api/plugin/:name/toggle
   * Enable/disable a plugin
   */
  router.post('/plugin/:name/toggle', (req, res) => {
    try {
      const { enabled } = req.body;
      pluginManager.setPluginEnabled(req.params.name, enabled);
      
      res.json({ 
        success: true,
        plugin: req.params.name,
        enabled
      });
    } catch (error) {
      console.error(`[API] Error toggling plugin ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to toggle plugin' });
    }
  });

  /**
   * POST /api/plugin/:name/refresh
   * Force refresh specific plugin
   */
  router.post('/plugin/:name/refresh', async (req, res) => {
    try {
      await pluginManager.refreshPlugin(req.params.name);
      res.json({ 
        success: true,
        plugin: req.params.name,
        message: 'Plugin refreshed'
      });
    } catch (error) {
      console.error(`[API] Error refreshing plugin ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to refresh plugin' });
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = initializeRoutes;
