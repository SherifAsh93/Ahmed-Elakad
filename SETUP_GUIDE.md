# Ahmed Elakad Couture — Setup Guide

## Prerequisites

- Node.js 18+ (Node 24 recommended)
- npm
- A VPS or server capable of writing to disk (Vercel serverless will NOT work for data persistence)
- Cloudinary account — **optional**, only needed for managing legacy images uploaded before June 2026

---

## Installation Steps

```bash
# 1. Clone or pull the repository
cd /home/sherif/sites/Ahmed-Elakad

# 2. Install dependencies
npm install

# 3. Create the data directories (if they don't exist)
mkdir -p /home/sherif/data/ahmed-elakad/images
mkdir -p /home/sherif/data/ahmed-elakad/voices

# 4. Initialize empty data files (if starting fresh)
echo '{"adminPassword":"114891"}' > /home/sherif/data/ahmed-elakad/config.json
echo '[]' > /home/sherif/data/ahmed-elakad/messages.json
echo '[]' > /home/sherif/data/ahmed-elakad/clients.json
echo '{"siteInfo":{"brandName":"Ahmed Elakad","labelName":"Couture"}}' > \
  /home/sherif/data/ahmed-elakad/content.json

# 5. Create .env.local with your credentials (see below)
nano .env.local

# 6. Start development server
npm run dev
# Visit http://localhost:3000
```

---

## Required Environment Variables

Create `.env.local` in the project root:

```bash
# Admin panel password
ADMIN_PASSWORD="114891"

# Site name (shown in browser tab)
NEXT_PUBLIC_SITE_NAME="Ahmed Elakad Couture"

# Cloudinary — OPTIONAL. Only needed if you need to see/delete pre-June-2026 images.
# New uploads go to VPS disk and do NOT require Cloudinary.
CLOUDINARY_CLOUD_NAME="dzppk5ylt"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_FOLDER="Ahmed Elakad"
```

**Without Cloudinary credentials:** The site works fully. New image uploads, image display, and all admin features work. The only thing missing is the ability to browse and delete the legacy Cloudinary image library (pre-June 2026). New uploads always go to VPS disk.

**How to get Cloudinary credentials (if needed):**
1. Log in at cloudinary.com (account: cloud name `dzppk5ylt`)
2. Dashboard → Settings → Access Keys
3. Copy API Key and API Secret

---

## Image Storage Architecture

Images are stored in **two places** depending on when they were uploaded:

| Era | Where stored | URL pattern |
|-----|-------------|------------|
| Before 2026-06-02 | Cloudinary CDN | `https://res.cloudinary.com/dzppk5ylt/image/upload/...` |
| After 2026-06-02 | VPS disk at `/home/sherif/data/ahmed-elakad/images/` | `https://ahmedelakad.com/media/{filename}` |

Both types of URLs are stored directly in `content.json` and still work. New uploads always use VPS local disk.

Voice recordings (Atelier CRM) are stored at `/home/sherif/data/ahmed-elakad/voices/` and served at `https://ahmedelakad.com/voices/{filename}`.

---

## All Dependencies and Why They Are Used

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.3 | React framework with App Router, Server Components, API routes |
| `react` | 19.2.4 | UI rendering library |
| `react-dom` | 19.2.4 | React DOM rendering |
| `cloudinary` | 2.9.0 | Cloudinary Node.js SDK — list and delete legacy images only (new uploads go to VPS disk) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5 | Type safety across the codebase |
| `@types/react` | 19 | TypeScript types for React |
| `@types/react-dom` | 19 | TypeScript types for React DOM |
| `@types/node` | 20 | TypeScript types for Node.js built-ins (fs, path, etc.) |
| `tailwindcss` | 4 | Utility-first CSS framework |
| `@tailwindcss/postcss` | 4 | Tailwind v4 PostCSS plugin |
| `eslint` | 9 | JavaScript/TypeScript linting |
| `eslint-config-next` | 16.2.3 | Next.js-specific ESLint rules |

---

## Development Workflow

```bash
# Start dev server with hot reload
npm run dev
# → http://localhost:3000

# Check for TypeScript/ESLint errors
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

**Development tips:**
- Admin panel: Visit `/admin`, password from `ADMIN_PASSWORD` env var (default: `114891`)
- To reset data, overwrite the JSON files in `/home/sherif/data/ahmed-elakad/`
- Uploaded images land in `/home/sherif/data/ahmed-elakad/images/` — make sure this directory is writable
- In dev mode, uploaded images use `https://ahmedelakad.com/media/` URLs — they will only resolve correctly in production or if you set up a local Nginx alias

---

## Build and Deployment Commands

### VPS Deployment with PM2 (production)
```bash
cd /home/sherif/sites/Ahmed-Elakad

# Build
npm run build

# Restart PM2 process to apply new build
pm2 restart ahmed-elakad

# Verify it's running
pm2 status ahmed-elakad
pm2 logs ahmed-elakad --lines 20
```

### Local Production Build
```bash
npm run build   # Compiles TypeScript, generates .next/
npm start       # Starts Next.js server on port 3000
```

### Vercel Deployment

**Important:** Vercel serverless functions cannot write to disk, so JSON data files and uploaded images won't persist between requests. Use Vercel for preview deployments only where data persistence is not critical.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production (not recommended — use VPS)
vercel --prod
```

---

## Data File Permissions

The Next.js process must have read and write permissions on the data directory:

```bash
# Check permissions
ls -la /home/sherif/data/ahmed-elakad/
ls -la /home/sherif/data/ahmed-elakad/images/ | head -5

# Fix permissions if needed
chmod 644 /home/sherif/data/ahmed-elakad/*.json
chmod 755 /home/sherif/data/ahmed-elakad/images/
chmod 755 /home/sherif/data/ahmed-elakad/voices/
chown -R sherif:sherif /home/sherif/data/ahmed-elakad/
```

---

## Nginx Configuration (VPS)

Full config at `/etc/nginx/sites-available/ahmedelakad.com`:

```nginx
server {
    server_name ahmedelakad.com www.ahmedelakad.com;
    client_max_body_size 50m;

    # Serve uploaded images directly — bypasses Next.js, cached 1 year
    location /media/ {
        alias /home/sherif/data/ahmed-elakad/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        try_files $uri =404;
    }

    # Serve voice note audio files directly
    location /voices/ {
        alias /home/sherif/data/ahmed-elakad/voices/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        try_files $uri =404;
    }

    # All other requests → Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    # ... SSL certs managed by Certbot
}
```

SSL certificate: Let's Encrypt via Certbot. Renews automatically. Expires 2026-08-10.
