# Deployment Guide - Racing Coach Chat

## Deploying to Netlify

### Option 1: Using Netlify UI

1. **Connect your repository** to Netlify
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment Variables** (Optional):
   Go to Site settings → Environment variables and add:
   
   - `REACT_APP_DEFAULT_API_PROVIDER` 
     - Value: `openai` or `synthetic`
     - Description: Pre-select the API provider
   
   - `REACT_APP_API_KEY`
     - Value: Your API key (e.g., `syn_xxxxx` or `sk-xxxxx`)
     - Description: Pre-configure the API key (users won't need to enter it)

4. **Deploy**: Click "Deploy site"

### Option 2: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Set environment variables (optional)
netlify env:set REACT_APP_DEFAULT_API_PROVIDER synthetic
netlify env:set REACT_APP_API_KEY your_api_key_here

# Deploy
netlify deploy --prod
```

### Option 3: Local Development with Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your values:
   ```
   REACT_APP_DEFAULT_API_PROVIDER=synthetic
   REACT_APP_API_KEY=syn_your_key_here
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Security Notes

- **Never commit** `.env.local` or any file containing real API keys to git
- The `.env.example` file is safe to commit (it contains no real values)
- For production deployments, always use Netlify's environment variable settings
- API keys set via environment variables will be used as defaults but can be overridden by users in the UI

## How Environment Variables Work

The app checks for API configuration in this order:

1. **User's localStorage** (if they've entered a key in the UI)
2. **Environment variables** (set in Netlify or `.env.local`)
3. **Default values** (empty key, OpenAI provider)

This means:
- If you set `REACT_APP_API_KEY` in Netlify, users won't need to enter a key
- Users can still override the default by entering their own key in the settings
- If no environment variables are set, users must configure the API in the UI
