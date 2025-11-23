# Troubleshooting Guide

## Environment Variables Not Working on Netlify

### Problem
You set `REACT_APP_API_KEY` in Netlify environment variables, but the app still says "API key required".

### Solution
Environment variables in Create React App are embedded at **build time**, not runtime. You must rebuild after adding/changing environment variables.

### Steps to Fix:

1. **Verify Environment Variables are Set**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Confirm `REACT_APP_API_KEY` is listed
   - Confirm `REACT_APP_DEFAULT_API_PROVIDER` is set (optional)

2. **Trigger a New Build**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for the build to complete

3. **Verify the Build**
   - Open your deployed site
   - Open browser console (F12)
   - Look for debug logs:
     ```
     🔍 Environment variables check:
       REACT_APP_API_KEY exists: true
       REACT_APP_API_KEY length: 32
       REACT_APP_DEFAULT_API_PROVIDER: synthetic
     ```

4. **If Still Not Working**
   - Check the build logs in Netlify for any errors
   - Verify the environment variable names are EXACTLY:
     - `REACT_APP_API_KEY` (not `API_KEY` or `REACT_API_KEY`)
     - `REACT_APP_DEFAULT_API_PROVIDER` (not `PROVIDER`)
   - Environment variables MUST start with `REACT_APP_` for Create React App

### Common Mistakes:

❌ **Wrong**: `API_KEY=syn_xxx`  
✅ **Correct**: `REACT_APP_API_KEY=syn_xxx`

❌ **Wrong**: Setting env vars but not rebuilding  
✅ **Correct**: Set env vars → Trigger new deploy

❌ **Wrong**: Expecting runtime changes  
✅ **Correct**: Env vars are baked into the build

## API Connection Issues

### Problem: "Connection failed" or 400 errors

**For Synthetic API:**
- Verify your key starts with `syn_`
- Ensure provider is set to `synthetic`
- Model should be `hf:openai/gpt-oss-120b`

**For OpenAI:**
- Verify your key starts with `sk-`
- Ensure provider is set to `openai`
- Model should be `gpt-4o-mini`

### Check Console Logs
Open browser console (F12) to see detailed error messages:
- Request URL
- Response status
- Error details

## Local Development

### Problem: Env vars not loading locally

1. Create `.env.local` file (not `.env`)
2. Add your variables:
   ```
   REACT_APP_API_KEY=syn_your_key_here
   REACT_APP_DEFAULT_API_PROVIDER=synthetic
   ```
3. Restart the development server (`npm start`)
4. Check console for debug logs

### Note on .gitignore
`.env.local` is already in `.gitignore` - never commit this file!

## Still Having Issues?

1. Clear browser cache and localStorage
2. Check browser console for errors
3. Verify your API key is valid by testing it directly with curl:

```bash
# Test Synthetic API
curl -X POST https://api.synthetic.new/v1/chat/completions \
  -H "Authorization: Bearer syn_your_key" \
  -H "Content-Type: application/json" \
  -d '{"model":"hf:openai/gpt-oss-120b","messages":[{"role":"user","content":"test"}]}'

# Test OpenAI API
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your_key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```
