# Deployment Guide

## Frontend on Vercel

1. Push the project to GitHub.
2. In Vercel, import the repository.
3. Set the Root Directory to `frontend`.
4. Deploy.
5. Update the API destination in `frontend/vercel.json` to your Render service URL.

## Backend on Render

1. Create a new Web Service on Render.
2. Connect the repository.
3. Set the Root Directory to the repository root.
4. Use the included `render.yaml` file or configure the service manually:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. After deployment, replace `YOUR_RENDER_SERVICE.onrender.com` in `frontend/vercel.json` with your Render service URL.
