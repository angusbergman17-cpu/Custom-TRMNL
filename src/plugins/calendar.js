const BasePlugin = require('./base-plugin');
const axios = require('axios');

/**
 * Calendar Plugin
 * Fetches calendar events from iCal/CalDAV URLs
 * Supports Google Calendar public URLs, Apple iCloud, etc.
 */
class CalendarPlugin extends BasePlugin {
  constructor(config = {}) {
    super(config);
    this.calendarUrl = config.calendarUrl || process.env.CALENDAR_URL;
    this.maxEvents = config.maxEvents || 5;
    
    if (!this.calendarUrl) {
      console.warn('[CalendarPlugin] No calendar URL provided. Plugin disabled.');
      this.enabled = false;
    }
  }

  async fetchData() {
    if (!this.calendarUrl) {
      throw new Error('Calendar URL not configured');
    }

    try {
      const response = await axios.get(this.calendarUrl);
      const icalData = response.data;
      
      // Parse iCal data
      const events = this.parseICalData(icalData);
      
      // Filter to upcoming events and limit
      const now = new Date();
      const upcomingEvents = events
        .filter(event => new Date(event.start) >= now)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, this.maxEvents);

      return {
        events: upcomingEvents,
        count: upcomingEvents.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[CalendarPlugin] Error fetching calendar:', error.message);
      // Return empty events on error
      return {
        events: [],
        count: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  parseICalData(icalData) {
    const events = [];
    const lines = icalData.split('\n');
    let currentEvent = null;

    for (let line of lines) {
      line = line.trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        
        if (key.startsWith('DTSTART')) {
          currentEvent.start = this.parseICalDate(value);
        } else if (key.startsWith('DTEND')) {
          currentEvent.end = this.parseICalDate(value);
        } else if (key === 'SUMMARY') {
          currentEvent.title = value;
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value;
        } else if (key === 'LOCATION') {
          currentEvent.location = value;
        }
      }
    }

    return events;
  }

  parseICalDate(dateStr) {
    // Handle both YYYYMMDDTHHMMSS and YYYYMMDD formats
    if (dateStr.includes('T')) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(9, 11);
      const minute = dateStr.substring(11, 13);
      const second = dateStr.substring(13, 15);
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    } else {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }
  }

  validate(data) {
    return data && Array.isArray(data.events);
  }
}

module.exports = CalendarPlugin;
