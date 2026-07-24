# Ahmed Elakad Couture

Luxury Egyptian fashion designer website and internal Atelier CRM.

**Live:** https://ahmedelakad.com
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · VPS + PM2 + Nginx

---

## Quick Start

```bash
cd /home/sherif/sites/Ahmed-Elakad
npm install
npm run dev       # http://localhost:3000
```

Copy `.env.local` with the required secrets (see PROJECT_CONTEXT.md).

---

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Home — hero + collection CTAs |
| `/about` | Designer bio + gallery |
| `/bridal/[year]` | Bridal collections (year or `all`) |
| `/couture/[year]` | Couture collections (year or `all`) |
| `/experience` | Testimonials + client videos |
| `/contact` | 4-step private Atelier enquiry form |
| `/contact?ref=ad` | Same page + auto-opens ad enquiry popup |
| `/atelier` | Internal staff CRM (Arabic RTL, no login) |
| `/admin` | Admin login — password: `114891` |
| `/admin/dashboard` | Full CMS |

---

## Deployment (VPS + PM2)

```bash
git pull origin main
npm run build
pm2 restart ahmed-elakad
pm2 logs ahmed-elakad
```

> This site is NOT on Vercel. It requires VPS disk access (`/home/sherif/data/ahmed-elakad/`) and local tools (yt-dlp, ffmpeg).

---

## Data Storage

All data is stored as JSON files on VPS disk at `/home/sherif/data/ahmed-elakad/`:
- `content.json` — site content (all editable text and image URLs)
- `clients.json` — Atelier CRM records
- `messages.json` — contact form submissions
- `ad-enquiries.json` — ad enquiry form submissions
- `analytics.json` — monthly Instagram analytics
- `config.json` — admin password
- `images/` — uploaded media files (~1,700+ files)

Nginx serves `images/` at `https://ahmedelakad.com/media/`.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Fallback admin password |
| `CLOUDINARY_CLOUD_NAME` | Legacy Cloudinary listing (optional) |
| `CLOUDINARY_API_SECRET` | Legacy Cloudinary listing (optional) |
| `ANTHROPIC_API_KEY` | Claude AI analytics audit |

---

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for full documentation.
