# Ahmed Elakad Couture — Setup Guide

## Prerequisites

- Node.js 18+ (Node 24 recommended)
- npm
- A Cloudinary account with a cloud configured
- A VPS or server capable of writing to disk (Vercel serverless will NOT work for data persistence)

---

## Installation Steps

```bash
# 1. Clone or pull the repository
cd /home/sherif/sites/Ahmed-Elakad

# 2. Install dependencies
npm install

# 3. Create the data directory (if it doesn't exist)
mkdir -p /home/sherif/data/ahmed-elakad

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

# Cloudinary image hosting
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_FOLDER="Ahmed Elakad"

# Site name (shown in browser tab)
NEXT_PUBLIC_SITE_NAME="Ahmed Elakad Couture"
```

For production, also create `.env.production` with the same variables (or set them in Vercel/PM2 environment).

**How to get Cloudinary credentials:**
1. Sign up at cloudinary.com
2. Dashboard → Settings → Access Keys
3. Copy Cloud name, API Key, and API Secret

---

## All Dependencies and Why They Are Used

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.3 | React framework with App Router, Server Components, API routes |
| `react` | 19.2.4 | UI rendering library |
| `react-dom` | 19.2.4 | React DOM rendering |
| `cloudinary` | 2.9.0 | Cloudinary Node.js SDK — upload, delete, and list images |

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
- Images are stored on Cloudinary; changing `CLOUDINARY_FOLDER` points to a different folder

---

## Build and Deployment Commands

### Local Production Build
```bash
npm run build   # Compiles TypeScript, generates .next/
npm start       # Starts Next.js server on port 3000
```

### VPS Deployment with PM2
```bash
# Build
npm run build

# Start with PM2 (if ecosystem.config.js exists)
pm2 start ecosystem.config.js --env production

# Or manually
pm2 start npm --name "ahmed-elakad" -- start

# Reload after code changes
pm2 reload ahmed-elakad
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

**Important for Vercel:** Vercel serverless functions cannot write to disk, so the JSON data files won't persist between requests. The site is designed to run on a persistent VPS server. Vercel can be used for preview deployments where data persistence is not needed.

---

## Data File Permissions

The Next.js process must have read and write permissions on the data directory:

```bash
# Check permissions
ls -la /home/sherif/data/ahmed-elakad/

# Fix permissions if needed
chmod 644 /home/sherif/data/ahmed-elakad/*.json
chown -R youruser:youruser /home/sherif/data/ahmed-elakad/
```

---

## Nginx Configuration (VPS)

The site typically runs behind Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name ahmedelakad.com www.ahmedelakad.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL is handled by Certbot/Let's Encrypt on top of this Nginx config.
