const CanvasRenderer = require('./canvas-renderer');

/**
 * Layout Engine
 * Composites plugin data into visual layouts
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
    const image = await this.renderer.createCanvas();
    
    // Draw header
    await this.drawHeader(image, 'DASHBOARD');
    
    // Layout zones
    const zones = [
      { name: 'weather', x: 10, y: 60, width: 380, height: 200 },
      { name: 'calendar', x: 10, y: 270, width: 780, height: 200 },
      { name: 'news', x: 400, y: 60, width: 390, height: 200 }
    ];

    for (const zone of zones) {
      await this.drawZone(image, zone, data[zone.name]);
    }

    // Convert for e-ink
    this.renderer.convertForEInk(image);
    
    return image;
  }

  /**
   * Render focus layout (single large item)
   */
  async renderFocus(data, focusPlugin = 'weather') {
    const image = await this.renderer.createCanvas();
    
    await this.drawHeader(image, focusPlugin.toUpperCase());
    
    const zone = { x: 20, y: 60, width: 760, height: 400 };
    await this.drawZone(image, zone, data[focusPlugin], true);

    this.renderer.convertForEInk(image);
    return image;
  }

  /**
   * Draw header bar
   */
  async drawHeader(image, title) {
    // Draw header background
    this.renderer.drawRect(image, 0, 0, this.renderer.width, 50, 0x000000FF, true);
    
    // Draw title
    await this.renderer.drawText(image, title, 20, 15, {
      fontSize: 32,
      color: 0xFFFFFFFF
    });

    // Draw timestamp
    const now = new Date().toLocaleString('en-AU', { 
      timeZone: 'Australia/Melbourne',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
    await this.renderer.drawText(image, now, this.renderer.width - 150, 20, {
      fontSize: 16,
      color: 0xFFFFFFFF
    });

    return image;
  }

  /**
   * Draw a data zone
   */
  async drawZone(image, zone, data, large = false) {
    if (!data) {
      await this.renderer.drawText(image, 'No data', zone.x + 10, zone.y + 10);
      return;
    }

    // Draw zone border
    this.renderer.drawRect(image, zone.x, zone.y, zone.width, zone.height, 0x000000FF, false);

    // Draw zone content based on data type
    if (data.temp !== undefined) {
      await this.drawWeather(image, zone, data, large);
    } else if (data.events !== undefined) {
      await this.drawCalendar(image, zone, data, large);
    } else if (data.items !== undefined) {
      await this.drawNews(image, zone, data, large);
    } else if (data.results !== undefined) {
      await this.drawCustom(image, zone, data, large);
    }

    return image;
  }

  /**
   * Draw weather data
   */
  async drawWeather(image, zone, data, large = false) {
    const fontSize = large ? 64 : 32;
    const padding = large ? 40 : 20;

    await this.renderer.drawText(image, data.location, zone.x + padding, zone.y + padding, {
      fontSize: large ? 32 : 16
    });

    await this.renderer.drawText(
      image, 
      `${data.temp}°C`, 
      zone.x + padding, 
      zone.y + padding + (large ? 60 : 40), 
      { fontSize }
    );

    await this.renderer.drawText(
      image,
      data.description,
      zone.x + padding,
      zone.y + padding + (large ? 140 : 90),
      { fontSize: large ? 24 : 16, maxWidth: zone.width - padding * 2 }
    );

    if (large) {
      await this.renderer.drawText(
        image,
        `Feels like: ${data.feels_like}°C`,
        zone.x + padding,
        zone.y + padding + 180,
        { fontSize: 16 }
      );
      await this.renderer.drawText(
        image,
        `High: ${data.temp_max}°C  Low: ${data.temp_min}°C`,
        zone.x + padding,
        zone.y + padding + 210,
        { fontSize: 16 }
      );
      await this.renderer.drawText(
        image,
        `Humidity: ${data.humidity}%  Wind: ${data.wind_speed} m/s`,
        zone.x + padding,
        zone.y + padding + 240,
        { fontSize: 16 }
      );
    }
  }

  /**
   * Draw calendar data
   */
  async drawCalendar(image, zone, data, large = false) {
    const padding = 15;
    let y = zone.y + padding;

    await this.renderer.drawText(image, 'Upcoming Events', zone.x + padding, y, {
      fontSize: large ? 24 : 16
    });
    y += large ? 40 : 30;

    if (!data.events || data.events.length === 0) {
      await this.renderer.drawText(image, 'No upcoming events', zone.x + padding, y, {
        fontSize: 16
      });
      return;
    }

    const maxEvents = large ? 8 : 4;
    for (const event of data.events.slice(0, maxEvents)) {
      const startDate = new Date(event.start);
      const timeStr = startDate.toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await this.renderer.drawText(image, timeStr, zone.x + padding, y, {
        fontSize: 14
      });
      y += 20;

      await this.renderer.drawText(image, event.title || 'Untitled Event', zone.x + padding, y, {
        fontSize: 16,
        maxWidth: zone.width - padding * 2
      });
      y += large ? 30 : 25;

      if (y > zone.y + zone.height - 40) break;
    }
  }

  /**
   * Draw news data
   */
  async drawNews(image, zone, data, large = false) {
    const padding = 15;
    let y = zone.y + padding;

    await this.renderer.drawText(image, 'Latest News', zone.x + padding, y, {
      fontSize: large ? 24 : 16
    });
    y += large ? 40 : 30;

    if (!data.items || data.items.length === 0) {
      await this.renderer.drawText(image, 'No news items', zone.x + padding, y, {
        fontSize: 16
      });
      return;
    }

    const maxItems = large ? 6 : 3;
    for (const item of data.items.slice(0, maxItems)) {
      // Draw bullet point
      this.renderer.drawRect(image, zone.x + padding, y + 5, 4, 4, 0x000000FF, true);

      await this.renderer.drawText(image, item.title, zone.x + padding + 10, y, {
        fontSize: large ? 18 : 14,
        maxWidth: zone.width - padding * 2 - 10
      });

      // Calculate line height based on wrapped text
      const font = await require('jimp').loadFont(require('jimp').FONT_SANS_16_BLACK);
      const lines = this.renderer.wrapText(item.title, font, zone.width - padding * 2 - 10);
      y += lines.length * (large ? 20 : 16) + (large ? 15 : 10);

      if (y > zone.y + zone.height - 40) break;
    }
  }

  /**
   * Draw custom API data
   */
  async drawCustom(image, zone, data, large = false) {
    const padding = 15;
    let y = zone.y + padding;

    await this.renderer.drawText(image, 'Custom Data', zone.x + padding, y, {
      fontSize: large ? 24 : 16
    });
    y += large ? 40 : 30;

    if (!data.results || data.results.length === 0) {
      await this.renderer.drawText(image, 'No custom data', zone.x + padding, y, {
        fontSize: 16
      });
      return;
    }

    for (const result of data.results) {
      if (result.status === 'success' && result.data) {
        await this.renderer.drawText(image, result.name, zone.x + padding, y, {
          fontSize: 16
        });
        y += 25;

        // Draw data (assuming it's JSON)
        const dataStr = typeof result.data === 'string' 
          ? result.data 
          : JSON.stringify(result.data).substring(0, 100);
        
        await this.renderer.drawText(image, dataStr, zone.x + padding, y, {
          fontSize: 14,
          maxWidth: zone.width - padding * 2
        });
        y += 30;
      }

      if (y > zone.y + zone.height - 40) break;
    }
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
