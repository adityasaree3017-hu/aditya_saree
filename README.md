# Adiyta Saree Website

This project contains a simple storefront website for Adiyta Saree with:

- Frontend static site in `frontend/`
- Express backend API in `backend/`
- Root `package.json` for local development

## Current project structure

```text
Adiyta Saree/
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── admin.html
│   ├── bgimg.webp
│   ├── hero_img.webp
│   ├── index.html
│   ├── read_about_us.jpeg
│   ├── script.js
│   ├── style.css
│   └── uploads/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Local development

```bash
npm install
npm start
```

This starts the Express server from `backend/server.js` and serves the frontend from `frontend/`.

## GitHub deployment

1. Create a new GitHub repository.
2. Push this project to GitHub.
3. Keep the current folder structure as-is.

## Vercel deployment

Important note:

- The current backend uses Express, in-memory storage, and file uploads.
- Vercel can host the frontend static files easily, but the current backend is not a good direct fit for Vercel without extra changes.

### Recommended setup

Use Vercel for the frontend only:

1. Import the GitHub repository in Vercel.
2. Set the Root Directory to `frontend`.
3. Deploy the frontend as a static site.

### Backend hosting

For the full website (including order API and admin panel), deploy the backend separately on a Node-supported platform such as:

- Render
- Railway
- Fly.io
- VPS / PM2 server

Then update the frontend API URLs if needed to point to the hosted backend.

## Suggested next step for full Vercel-ready deployment

To make this fully Vercel-friendly, the backend should be converted into serverless functions or a separate deployment. The current Express app is suitable for local development and server hosting, but not for a straightforward Vercel static deployment.

## Notes

- `frontend/uploads/` is for uploaded product images during local development.
- `frontend/uploads/*` is ignored in `.gitignore` so image uploads do not pollute GitHub.
