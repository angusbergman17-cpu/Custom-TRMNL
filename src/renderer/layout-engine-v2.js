const CanvasRenderer = require('./canvas-renderer-v2');

/**
 * Layout Engine
 * Composites plugin data into visual layouts using SVG-based rendering
 */
class LayoutEngine {
  constructor(config = {}) {
    this.renderer = new CanvasRenderer(config.renderer || {});
    this.layouts = config.layouts || {};
    this.currentLayout = config.currentLayout || 'dashboard';
  }

  /**
   * Render dashboard layout
   */
  async renderDashboard(data) {
    const elements = [];
    
    // Header
    elements.push(...this.createHeader('DASHBOARD'));
    
    // Weather zone (top-left)
    if (data.weather) {
      elements.push(...this.createWeatherZone(data.weather, 10, 60, 380, 200));
    }
    
    // News zone (top-right)
    if (data.news) {
      elements.push(...this.createNewsZone(data.news, 400, 60, 390, 200));
    }
    
    // Calendar zone (bottom, full width)
    if (data.calendar) {
      elements.push(...this.createCalendarZone(data.calendar, 10, 270, 780, 200));
    }
    
    const image = await this.renderer.render(elements);
    const converted = await this.renderer.convertForEInk(await image.toBuffer());
    
    return converted;
  }

  /**
   * Render focus layout (single large item)
   */
  async renderFocus(data, focusPlugin = 'weather') {
    const elements = [];
    
    elements.push(...this.createHeader(focusPlugin.toUpperCase()));
    
    const pluginData = data[focusPlugin];
    if (!pluginData) {
      elements.push({ type: 'text', x: 40, y: 240, text: 'No data available', fontSize: 24 });
    } else if (pluginData.temp !== undefined) {
      elements.push(...this.createWeatherZone(pluginData, 20, 60, 760, 400, true));
    } else if (pluginData.events !== undefined) {
      elements.push(...this.createCalendarZone(pluginData, 20, 60, 760, 400, true));
    } else if (pluginData.items !== undefined) {
      elements.push(...this.createNewsZone(pluginData, 20, 60, 760, 400, true));
    }

    const image = await this.renderer.render(elements);
    const converted = await this.renderer.convertForEInk(await image.toBuffer());
    
    return converted;
  }

  /**
   * Create header elements
   */
  createHeader(title) {
    const now = new Date().toLocaleString('en-AU', { 
      timeZone: 'Australia/Melbourne',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });

    return [
      { type: 'rect', x: 0, y: 0, width: this.renderer.width, height: 50, fill: '#000' },
      { type: 'text', x: 20, y: 35, text: title, fontSize: 28, fill: '#fff', bold: true },
      { type: 'text', x: this.renderer.width - 150, y: 32, text: now, fontSize: 16, fill: '#fff' }
    ];
  }

  /**
   * Create weather zone
   */
  createWeatherZone(data, x, y, width, height, large = false) {
    const elements = [];
    const padding = large ? 40 : 15;
    const fontSize = large ? 48 : 24;
    
    // Border
    elements.push({ type: 'rect', x, y, width, height, fill: 'none', stroke: '#000', strokeWidth: 2 });
    
    // Location
    elements.push({ 
      type: 'text', 
      x: x + padding, 
      y: y + padding + (large ? 24 : 18), 
      text: data.location, 
      fontSize: large ? 24 : 16,
      bold: true
    });
    
    // Temperature
    elements.push({ 
      type: 'text', 
      x: x + padding, 
      y: y + padding + (large ? 80 : 50), 
      text: `${data.temp}°C`, 
      fontSize,
      bold: true
    });
    
    // Description
    const desc = data.description.charAt(0).toUpperCase() + data.description.slice(1);
    elements.push({ 
      type: 'text', 
      x: x + padding, 
      y: y + padding + (large ? 140 : 90), 
      text: desc, 
      fontSize: large ? 20 : 16
    });
    
    if (large) {
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: y + padding + 180, 
        text: `Feels like: ${data.feels_like}°C`, 
        fontSize: 16
      });
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: y + padding + 210, 
        text: `High: ${data.temp_max}°C  Low: ${data.temp_min}°C`, 
        fontSize: 16
      });
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: y + padding + 240, 
        text: `Humidity: ${data.humidity}%  Wind: ${data.wind_speed} m/s`, 
        fontSize: 16
      });
    }
    
    return elements;
  }

  /**
   * Create calendar zone
   */
  createCalendarZone(data, x, y, width, height, large = false) {
    const elements = [];
    const padding = 15;
    let currentY = y + padding + 20;
    
    // Border
    elements.push({ type: 'rect', x, y, width, height, fill: 'none', stroke: '#000', strokeWidth: 2 });
    
    // Title
    elements.push({ 
      type: 'text', 
      x: x + padding, 
      y: currentY, 
      text: 'Upcoming Events', 
      fontSize: large ? 24 : 18,
      bold: true
    });
    currentY += large ? 35 : 28;
    
    if (!data.events || data.events.length === 0) {
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: currentY, 
        text: 'No upcoming events', 
        fontSize: 16
      });
      return elements;
    }
    
    const maxEvents = large ? 8 : 4;
    for (const event of data.events.slice(0, maxEvents)) {
      if (currentY > y + height - 40) break;
      
      const startDate = new Date(event.start);
      const timeStr = startDate.toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Time
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: currentY, 
        text: timeStr, 
        fontSize: 14
      });
      currentY += 18;
      
      // Event title (wrapped if necessary)
      const titleLines = this.renderer.wrapText(event.title || 'Untitled Event', width - padding * 2, 16);
      for (const line of titleLines.slice(0, 2)) { // Max 2 lines per event
        elements.push({ 
          type: 'text', 
          x: x + padding, 
          y: currentY, 
          text: line, 
          fontSize: 16,
          bold: true
        });
        currentY += 18;
      }
      
      currentY += large ? 12 : 8;
    }
    
    return elements;
  }

  /**
   * Create news zone
   */
  createNewsZone(data, x, y, width, height, large = false) {
    const elements = [];
    const padding = 15;
    let currentY = y + padding + 20;
    
    // Border
    elements.push({ type: 'rect', x, y, width, height, fill: 'none', stroke: '#000', strokeWidth: 2 });
    
    // Title
    elements.push({ 
      type: 'text', 
      x: x + padding, 
      y: currentY, 
      text: 'Latest News', 
      fontSize: large ? 24 : 18,
      bold: true
    });
    currentY += large ? 35 : 28;
    
    if (!data.items || data.items.length === 0) {
      elements.push({ 
        type: 'text', 
        x: x + padding, 
        y: currentY, 
        text: 'No news available', 
        fontSize: 16
      });
      return elements;
    }
    
    const maxItems = large ? 6 : 3;
    for (const item of data.items.slice(0, maxItems)) {
      if (currentY > y + height - 40) break;
      
      // Bullet point
      elements.push({ 
        type: 'rect', 
        x: x + padding, 
        y: currentY - 6, 
        width: 4, 
        height: 4, 
        fill: '#000'
      });
      
      // Title (wrapped)
      const titleLines = this.renderer.wrapText(item.title, width - padding * 2 - 10, large ? 16 : 14);
      for (const line of titleLines.slice(0, 3)) { // Max 3 lines per item
        elements.push({ 
          type: 'text', 
          x: x + padding + 10, 
          y: currentY, 
          text: line, 
          fontSize: large ? 16 : 14
        });
        currentY += large ? 18 : 16;
      }
      
      currentY += large ? 12 : 8;
    }
    
    return elements;
  }

  /**
   * Render current layout
   */
  async render(data, layoutName = null) {
    const layout = layoutName || this.currentLayout;

    switch (layout) {
      case 'dashboard':
        return this.renderDashboard(data);
      case 'focus-weather':
        return this.renderFocus(data, 'weather');
      case 'focus-calendar':
        return this.renderFocus(data, 'calendar');
      case 'focus-news':
        return this.renderFocus(data, 'news');
      default:
        return this.renderDashboard(data);
    }
  }

  /**
   * Set current layout
   */
  setLayout(layoutName) {
    this.currentLayout = layoutName;
  }
}

module.exports = LayoutEngine;
