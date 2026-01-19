require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import our modules
const PluginManager = require('./plugins');
const LayoutEngine = require('./renderer/layout-engine-v2');
const RefreshManager = require('./scheduler/refresh-manager');
const initializeRoutes = require('./routes/api');

// Load configuration
const configPath = path.join(__dirname, '..', 'config', 'default.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Override config with environment variables
if (process.env.PORT) {
  config.server.port = parseInt(process.env.PORT);
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize system components
console.log('🚀 Initializing TRMNL Server...');

// 1. Plugin Manager
const pluginManager = new PluginManager(config.plugins);
console.log('✓ Plugin Manager initialized');

// 2. Layout Engine
const layoutEngine = new LayoutEngine({
  renderer: config.device,
  layouts: config.layouts,
  currentLayout: config.layout.current
});
console.log('✓ Layout Engine initialized');

// 3. Refresh Manager
const refreshManager = new RefreshManager(
  pluginManager,
  layoutEngine,
  config.refresh
);
console.log('✓ Refresh Manager initialized');

// Initialize API routes
app.use('/api', initializeRoutes(pluginManager, layoutEngine, refreshManager));
console.log('✓ API routes initialized');

// Root redirect to dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🖥️  TRMNL Server Running');
  console.log('═══════════════════════════════════════════');
  console.log(`  Dashboard:  http://localhost:${PORT}`);
  console.log(`  API:        http://localhost:${PORT}/api`);
  console.log(`  Screen:     http://localhost:${PORT}/api/screen`);
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Start automatic refresh and rotation
  refreshManager.start();
  console.log('✓ Auto-refresh started');
  
  if (config.refresh.rotation.enabled) {
    console.log('✓ Layout rotation started');
  }
  
  console.log('');
  console.log('Server ready! 🎉');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  refreshManager.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  refreshManager.stop();
  process.exit(0);
});

module.exports = app;
