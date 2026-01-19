let statusInterval;
let screenRefreshInterval;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadStatus();
    startStatusPolling();
    startScreenRefresh();
});

// Load system status
async function loadStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        updateConnectionStatus(true);
        updateSystemInfo(data);
        updatePluginStatus(data.plugins);
        updateLayoutInfo(data.layout, data.refresh);
        updateLastRefresh(data.refresh.lastRefresh);
    } catch (error) {
        console.error('Error loading status:', error);
        updateConnectionStatus(false);
    }
}

// Update connection indicator
function updateConnectionStatus(online) {
    const dot = document.getElementById('connection-status');
    const text = document.getElementById('connection-text');
    
    if (online) {
        dot.className = 'status-dot online';
        text.textContent = 'Connected';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'Disconnected';
    }
}

// Update system info section
function updateSystemInfo(data) {
    document.getElementById('refresh-interval').textContent = 
        `${data.refresh.refreshInterval / 1000}s`;
    document.getElementById('auto-refresh').textContent = 
        data.refresh.refreshEnabled ? '✓ Enabled' : '✗ Disabled';
    document.getElementById('server-time').textContent = 
        new Date(data.timestamp).toLocaleString();
}

// Update plugin status
function updatePluginStatus(plugins) {
    const container = document.getElementById('plugin-status');
    container.innerHTML = '';
    
    for (const [name, info] of Object.entries(plugins)) {
        const item = document.createElement('div');
        item.className = 'plugin-item';
        
        const cacheAge = info.cacheAge ? `${Math.round(info.cacheAge / 1000)}s ago` : 'Never';
        
        item.innerHTML = `
            <div class="plugin-info">
                <div class="plugin-name">${name}</div>
                <div class="plugin-status">
                    Last fetch: ${cacheAge} | 
                    Refresh: ${info.refreshInterval / 1000}s
                </div>
            </div>
            <div class="plugin-actions">
                <button 
                    class="plugin-toggle ${info.enabled ? 'enabled' : ''}" 
                    onclick="togglePlugin('${name}', ${!info.enabled})"
                >
                    ${info.enabled ? '✓ Enabled' : 'Disabled'}
                </button>
                <button 
                    class="btn btn-small" 
                    onclick="refreshPlugin('${name}')"
                >
                    ↻
                </button>
            </div>
        `;
        
        container.appendChild(item);
    }
}

// Update layout info
function updateLayoutInfo(layout, refresh) {
    const select = document.getElementById('layout-select');
    select.value = refresh.currentLayout || layout.current;
    
    const rotationEnabled = document.getElementById('rotation-enabled');
    rotationEnabled.checked = refresh.rotationEnabled || false;
    
    const rotationSettings = document.getElementById('rotation-settings');
    rotationSettings.style.display = rotationEnabled.checked ? 'block' : 'none';
    
    if (refresh.rotationInterval) {
        document.getElementById('rotation-interval').value = refresh.rotationInterval / 1000;
    }
}

// Update last refresh time
function updateLastRefresh(timestamp) {
    if (!timestamp) return;
    
    const time = new Date(timestamp).toLocaleString();
    document.getElementById('last-refresh').textContent = `Last refresh: ${time}`;
}

// Refresh screen
async function refreshScreen() {
    try {
        const response = await fetch('/api/refresh', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            // Reload screen image with cache buster
            const img = document.getElementById('screen-image');
            img.src = `/api/screen?t=${Date.now()}`;
            updateLastRefresh(data.timestamp);
        }
    } catch (error) {
        console.error('Error refreshing screen:', error);
        alert('Failed to refresh screen');
    }
}

// Download current screen
function downloadScreen() {
    const link = document.createElement('a');
    link.href = `/api/screen?t=${Date.now()}`;
    link.download = `trmnl-screen-${Date.now()}.png`;
    link.click();
}

// Change layout
async function changeLayout() {
    const layout = document.getElementById('layout-select').value;
    
    try {
        const response = await fetch('/api/layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout })
        });
        
        if (response.ok) {
            setTimeout(() => {
                const img = document.getElementById('screen-image');
                img.src = `/api/screen?t=${Date.now()}`;
            }, 500);
        }
    } catch (error) {
        console.error('Error changing layout:', error);
        alert('Failed to change layout');
    }
}

// Toggle rotation
function toggleRotation() {
    const enabled = document.getElementById('rotation-enabled').checked;
    const settings = document.getElementById('rotation-settings');
    settings.style.display = enabled ? 'block' : 'none';
    
    updateRotation();
}

// Update rotation settings
async function updateRotation() {
    const enabled = document.getElementById('rotation-enabled').checked;
    const interval = parseInt(document.getElementById('rotation-interval').value) * 1000;
    
    try {
        const response = await fetch('/api/rotation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, interval })
        });
        
        if (response.ok) {
            console.log('Rotation settings updated');
        }
    } catch (error) {
        console.error('Error updating rotation:', error);
        alert('Failed to update rotation settings');
    }
}

// Toggle plugin
async function togglePlugin(name, enabled) {
    try {
        const response = await fetch(`/api/plugin/${name}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
        
        if (response.ok) {
            loadStatus(); // Reload to update UI
        }
    } catch (error) {
        console.error(`Error toggling plugin ${name}:`, error);
        alert(`Failed to toggle ${name}`);
    }
}

// Refresh specific plugin
async function refreshPlugin(name) {
    try {
        const response = await fetch(`/api/plugin/${name}/refresh`, {
            method: 'POST'
        });
        
        if (response.ok) {
            loadStatus(); // Reload to update cache age
        }
    } catch (error) {
        console.error(`Error refreshing plugin ${name}:`, error);
        alert(`Failed to refresh ${name}`);
    }
}

// Start polling for status updates
function startStatusPolling() {
    statusInterval = setInterval(loadStatus, 10000); // Every 10 seconds
}

// Auto-refresh screen preview
function startScreenRefresh() {
    screenRefreshInterval = setInterval(() => {
        const img = document.getElementById('screen-image');
        img.src = `/api/screen?t=${Date.now()}`;
    }, 30000); // Every 30 seconds
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    if (screenRefreshInterval) clearInterval(screenRefreshInterval);
});
