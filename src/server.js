require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import modules
const PluginManager = require('./plugins');
const LayoutEngine = require('./renderer/layout-engine-v2');
const RefreshManager = require('./scheduler/refresh-manager');
const initializeRoutes = require('./routes/api');

// Load configuration
const configPath = path.join(__dirname, '..', 'config', 'default.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Setup components
const pluginManager = new PluginManager(config.plugins);
const layoutEngine = new LayoutEngine({
  renderer: config.device,
  layouts: config.layouts,
  currentLayout: config.layout.current
});
const refreshManager = new RefreshManager(pluginManager, layoutEngine, config.refresh);

// Initialize API
app.use('/api', initializeRoutes(pluginManager, layoutEngine, refreshManager));

// Start server - FIXED FOR RENDER
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0'; // This must be 0.0.0.0 for Render to work

app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════');
  console.log('  🖥️  TRMNL Server Online');
  console.log(`  URL: https://trmnl-server.onrender.com/api/screen`);
  console.log('═══════════════════════════════════════════');
  refreshManager.start();
});