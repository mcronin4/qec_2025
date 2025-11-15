# Deployment Guide

This guide explains how to configure the application for deployment to Vercel.

## Environment Variables

### Frontend (Vercel)

In your Vercel project settings, add the following environment variable:

- **`NEXT_PUBLIC_BACKEND_URL`**: The URL of your deployed backend API
  - Example: `https://your-backend.herokuapp.com` or `https://your-backend.railway.app`
  - For local development, this defaults to `http://localhost:8000`

**How to set in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `NEXT_PUBLIC_BACKEND_URL` with your backend URL
4. Redeploy your application

### Backend (Your hosting platform)

Set the following environment variable on your backend hosting platform:

- **`ALLOWED_ORIGINS`**: Comma-separated list of allowed CORS origins
  - Example: `http://localhost:3000,https://your-app.vercel.app`
  - Include all URLs that should be able to access your backend:
    - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
    - Your Vercel preview URLs (e.g., `https://your-app-git-main.vercel.app`)
    - Local development URLs (e.g., `http://localhost:3000`)

**How to set:**
- **Vercel**: Go to your backend project → Settings → Environment Variables → Add `ALLOWED_ORIGINS`
- **Heroku**: `heroku config:set ALLOWED_ORIGINS="https://your-app.vercel.app"`
- **Railway**: Add in project settings → Variables
- **Render**: Add in Environment section
- **Local development**: Create a `.env` file in the `backend/` directory

**Important for Vercel Backend:**
- Make sure to set `ALLOWED_ORIGINS` in your Vercel backend project settings
- Include your frontend URL: `https://plowking.vercel.app`
- You may also want to include preview URLs: `https://plowking-*.vercel.app` (wildcard)
- After setting the environment variable, **redeploy your backend**

## Example Configuration

### For Vercel Frontend:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.herokuapp.com
```

### For Backend:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

## Important Notes

1. **CORS Configuration**: The backend will only accept requests from origins listed in `ALLOWED_ORIGINS`. Make sure to include:
   - Your production Vercel URL
   - Your preview deployment URLs (if you want them to work)
   - Local development URLs (for testing)

2. **Environment Variable Prefix**: Frontend environment variables that should be accessible in the browser must be prefixed with `NEXT_PUBLIC_`. This is why we use `NEXT_PUBLIC_BACKEND_URL`.

3. **Backend Deployment on Vercel**: 
   - The backend uses Mangum to convert FastAPI to a Vercel serverless function
   - Make sure `backend/vercel.json` and `backend/api/index.py` are in your repository
   - Set the `ALLOWED_ORIGINS` environment variable in your Vercel backend project
   - The backend will be deployed as serverless functions
   
   **Alternative platforms** (if not using Vercel):
   - Heroku
   - Railway
   - Render
   - AWS/GCP/Azure
   - Any platform that supports Python/FastAPI

4. **Testing**: After deployment, test that:
   - The frontend can reach the backend API
   - CORS errors don't appear in the browser console
   - The simulation works correctly

