# Deploying to Render.com (Free Tier)

## Step 1: Prepare Your Code

1. Push this entire folder to a GitHub repo
2. Make sure `.env` is in `.gitignore` (don't commit secrets!)

## Step 2: Create Render Service

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name:** trmnl-server
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

## Step 3: Add Environment Variables

In Render dashboard, go to "Environment" and add these:

```
PORT=10000
NODE_ENV=production
WEATHER_API_KEY=<your_key>
WEATHER_LOCATION=Melbourne,AU
CALENDAR_URL=<your_ical_url>
NEWS_FEEDS=<rss_feeds>
CUSTOM_ENDPOINTS=<your_apis>
DEVICE_WIDTH=800
DEVICE_HEIGHT=480
DEVICE_COLOR_DEPTH=1
REFRESH_INTERVAL=300
ROTATION_ENABLED=true
ROTATION_INTERVAL=30
```

## Step 4: Deploy

Click "Create Web Service" – Render will:
- Clone your repo
- Install dependencies
- Start the server
- Give you a URL like `https://trmnl-server-abc123.onrender.com`

## Step 5: Configure Your TRMNL Device

Point your TRMNL to: `https://your-render-url.onrender.com/api/screen`

## Free Tier Notes

- Service sleeps after 15min inactivity
- First request after sleep takes ~30sec to wake
- 750 hours/month free (enough for 24/7)
- For true 24/7, set up a cron job to ping every 14min (or upgrade to paid)

## Keep-Alive Service (Optional)

Use UptimeRobot (free) to ping your server every 5min:
- Monitor URL: `https://your-render-url.onrender.com/api/health`
- Interval: 5 minutes
- This prevents sleep on free tier

## Troubleshooting

**Server crashes on startup?**
- Check Render logs for missing env vars
- Verify all API keys are valid

**Images not generating?**
- Canvas library needs system deps (Render handles this)
- Check logs for renderer errors

**TRMNL can't connect?**
- Make sure URL is https:// not http://
- Check `/api/health` endpoint works in browser
