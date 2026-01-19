# 🖥️ TRMNL Custom Server

A fully customizable server for TRMNL e-ink displays with complete control over refresh rates, data sources, layouts, and rotation.

## ✨ Features

- **Multi-zone dashboard layouts** with weather, calendar, news, and custom APIs
- **Layout rotation** - automatically cycle through different views
- **Configurable refresh rates** - control exactly when and how often data updates
- **Plugin system** - easily add new data sources
- **Web dashboard** - control everything from a beautiful web interface
- **E-ink optimized** - renders clean black & white images perfect for e-paper
- **Free hosting** - designed to run on free tiers (Render, Railway, etc.)

## 📋 Prerequisites

- Node.js 14+ installed
- A TRMNL device (or any e-ink display that can fetch images from URLs)
- API keys for data sources you want to use (OpenWeather, etc.)

## 🚀 Quick Start

### 1. Clone/Download

```bash
git clone <your-repo-url>
cd trmnl-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENWEATHER_API_KEY=your_key_here
CALENDAR_URL=https://calendar.google.com/calendar/ical/...
```

### 3. Configure Settings

Edit `config/default.json` to customize:
- Device resolution and color depth
- Plugin settings (refresh intervals, locations, etc.)
- Layout preferences
- Rotation settings

### 4. Run Locally

```bash
npm start
```

Visit http://localhost:3000 to see the dashboard!

## 🌐 Deploy to Render.com (Free)

### One-Click Deploy

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo (or upload this code)
4. Configure:
   - **Name:** trmnl-server
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. Add environment variables:
   - `OPENWEATHER_API_KEY`
   - `CALENDAR_URL` (optional)
   - Any other API keys you need

6. Deploy! 🎉

Your server will be live at `https://your-app-name.onrender.com`

### Alternative: Railway.app

Railway gives you $5/month free credit:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## 🎯 Configure Your TRMNL Device

Point your TRMNL device to:
```
https://your-app-name.onrender.com/api/screen
```

The device will fetch a fresh e-ink optimized image from this endpoint.

## 🎨 Layouts

### Available Layouts

1. **Dashboard** - Multi-zone layout with weather, calendar, and news
2. **Focus: Weather** - Large weather display
3. **Focus: Calendar** - Upcoming events
4. **Focus: News** - Latest headlines

### Rotation

Enable rotation in the web dashboard or via config:

```json
"rotation": {
  "enabled": true,
  "interval": 300000,  // 5 minutes
  "layouts": ["dashboard", "focus-weather", "focus-calendar"]
}
```

## 🔌 Data Sources (Plugins)

### Weather

Uses OpenWeatherMap API.

**Get API key:** https://openweathermap.org/api (free tier: 1000 calls/day)

**Config:**
```json
"weather": {
  "enabled": true,
  "refreshInterval": 900000,  // 15 minutes
  "location": "Melbourne,AU",
  "units": "metric"
}
```

### Calendar

Supports any iCal feed (Google Calendar, Apple iCloud, etc.).

**Get calendar URL:**
- Google Calendar: Settings → Calendar → Integrate → Secret address in iCal format
- Apple iCloud: Calendar.app → Share → Public Calendar

**Config:**
```json
"calendar": {
  "enabled": true,
  "refreshInterval": 300000,  // 5 minutes
  "maxEvents": 5
}
```

### News

Fetches from RSS feeds.

**Default feeds:**
- BBC World News
- NY Times World

**Config:**
```json
"news": {
  "enabled": true,
  "refreshInterval": 1800000,  // 30 minutes
  "feeds": [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://your-custom-feed.xml"
  ]
}
```

### Custom APIs

Hit any REST API endpoint.

**Config:**
```json
"custom": {
  "enabled": true,
  "endpoints": [
    {
      "name": "My API",
      "url": "https://api.example.com/data",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  ]
}
```

## 🛠️ API Endpoints

### Device Endpoints

- `GET /api/screen` - Get current screen image (PNG)
- `POST /api/refresh` - Force refresh now

### Control Endpoints

- `GET /api/status` - System status
- `GET /api/data` - All plugin data
- `GET /api/data/:plugin` - Specific plugin data
- `POST /api/layout` - Change layout
- `POST /api/rotation` - Configure rotation
- `POST /api/plugin/:name/toggle` - Enable/disable plugin
- `POST /api/plugin/:name/refresh` - Refresh specific plugin

## 📱 Web Dashboard

Access at `http://your-server-url/`

Features:
- Live screen preview
- Manual refresh button
- Layout switching
- Rotation controls
- Plugin management
- System status

## 🎛️ Advanced Configuration

### Custom Layouts

Create new layouts by editing `src/renderer/layout-engine.js`:

```javascript
async renderMyCustomLayout(data) {
  const image = await this.renderer.createCanvas();
  // Your custom rendering logic
  return image;
}
```

Then add to rotation:
```json
"layouts": ["dashboard", "my-custom-layout"]
```

### Custom Plugins

Create new data sources in `src/plugins/`:

```javascript
const BasePlugin = require('./base-plugin');

class MyPlugin extends BasePlugin {
  async fetchData() {
    // Fetch your data
    return { ... };
  }
}

module.exports = MyPlugin;
```

Register in `src/plugins/index.js`.

### Refresh Schedules

Different rates for different times:

```javascript
// In src/scheduler/refresh-manager.js
// Add time-based logic
const hour = new Date().getHours();
if (hour >= 9 && hour <= 17) {
  this.refreshInterval = 300000;  // 5 min during work hours
} else {
  this.refreshInterval = 1800000; // 30 min otherwise
}
```

## 🐛 Troubleshooting

### Screen shows "No data"

- Check plugin is enabled in config
- Verify API keys in `.env`
- Check logs for errors: `heroku logs --tail` or check Render dashboard

### Image not updating on device

- Check device is hitting correct URL
- Verify server is running: visit `/api/health`
- Try manual refresh in dashboard

### Plugins returning errors

- Verify API keys are correct
- Check rate limits on external APIs
- Test endpoints manually with curl

## 📝 Environment Variables

All configuration via `.env`:

```env
# Required
OPENWEATHER_API_KEY=your_key

# Optional
CALENDAR_URL=https://calendar.google.com/...
PORT=3000
NODE_ENV=production
```

## 🔐 Security Notes

- Keep your `.env` file private (it's gitignored)
- Don't commit API keys to git
- Use environment variables for all secrets
- Consider adding authentication to your dashboard in production

## 📊 Resource Usage

**Free tier limits:**
- Render: Always-on, 512MB RAM (goes to sleep after 15 min inactivity)
- Railway: $5/month credit, usage-based billing
- Memory usage: ~50-100MB
- CPU: Minimal (only during refresh)

## 🎯 Next Steps

1. **Add more data sources** - Create custom plugins
2. **Design custom layouts** - Tailor the display to your needs
3. **Set up webhooks** - Trigger refreshes from external events
4. **Add authentication** - Secure your dashboard
5. **Monitor uptime** - Use UptimeRobot or similar

## 💡 Tips

- Use longer refresh intervals to save API quotas
- Test layouts locally before deploying
- Monitor plugin cache age in dashboard
- Keep rotation intervals > 2 minutes (e-ink refresh wear)

## 🤝 Contributing

Feel free to submit issues and PRs!

## 📄 License

MIT License - Do whatever you want with it!

---

Built with ☕ by Angus for complete TRMNL control
