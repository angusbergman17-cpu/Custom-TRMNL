const BasePlugin = require('./base-plugin');
const Parser = require('rss-parser');

/**
 * News Plugin
 * Fetches news from RSS feeds
 */
class NewsPlugin extends BasePlugin {
  constructor(config = {}) {
    super(config);
    this.feeds = config.feeds || [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
    ];
    this.maxItems = config.maxItems || 5;
    this.parser = new Parser();
  }

  async fetchData() {
    try {
      const allItems = [];

      // Fetch from all configured feeds
      for (const feedUrl of this.feeds) {
        try {
          const feed = await this.parser.parseURL(feedUrl);
          const items = feed.items.slice(0, this.maxItems).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: feed.title,
            description: item.contentSnippet || item.description
          }));
          allItems.push(...items);
        } catch (error) {
          console.error(`[NewsPlugin] Error fetching feed ${feedUrl}:`, error.message);
        }
      }

      // Sort by date and limit
      allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      return {
        items: allItems.slice(0, this.maxItems),
        count: allItems.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[NewsPlugin] Error fetching news:', error.message);
      return {
        items: [],
        count: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  validate(data) {
    return data && Array.isArray(data.items);
  }
}

module.exports = NewsPlugin;
