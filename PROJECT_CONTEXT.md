# Ahmed Elakad Couture — PROJECT_CONTEXT

## Project Overview

Luxury Egyptian fashion designer website for Ahmed Elakad Couture. The site serves two purposes:

1. **Public portfolio** — showcasing bridal and couture collections (2016–present), an "experience" page with testimonials and client videos, a booking/enquiry form for prospective clients, and an internal Atelier page for walk-in clients.
2. **Admin CMS** — a password-protected dashboard for managing all site content, images, messages, client records, analytics, and ad enquiries without touching code.

**Live URL:** https://ahmedelakad.com
**GitHub:** https://github.com/SherifAsh93/Ahmed-Elakad
**Local path:** `/home/sherif/sites/Ahmed-Elakad`
**Admin password:** `114891` (also changeable from admin dashboard; stored in `/home/sherif/data/ahmed-elakad/config.json`)

---

## Features

### Public site
- Hero section with dynamic background, CTA buttons
- Bridal collections by year (`/bridal/[year]`) with masonry gallery + cover image
- Couture collections by year (`/couture/[year]`) with masonry gallery
- About page with designer bio and gallery
- Experience page with testimonials, client videos, and Instagram embeds
- Contact page with 4-step AtelierForm (Identity → Timeline → Vision → Investment)
- AdInquiryPopup modal triggered by `?ref=ad` URL param (for paid ad traffic)
- Atelier CRM page (`/atelier`) for staff use — Arabic RTL, no auth required

### Admin dashboard (`/admin/dashboard`)
- Full site content editor (all sections, images, bio text, CTA copy)
- Image manager — upload (images & videos), drag-reorder, delete, cover selection
- Cloudinary image sync (legacy read — grab image by URL to local disk)
- Instagram video download via yt-dlp (`/api/ig-video`)
- Messages inbox (contact form submissions)
- Ad enquiries inbox (from AdInquiryPopup form)
- Client CRM — create/edit client records, payments, dress tracking, voice notes
- Analytics dashboard — monthly Instagram post data + AI-powered audit via Claude
- Admin password change

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.3 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Runtime | Node.js (custom Next.js server via PM2) |
| File uploads | Busboy (streaming multipart parser) |
| Video processing | ffmpeg (`/usr/bin/ffmpeg`) — transcode uploads to mp4 |
| Instagram download | yt-dlp (`/home/sherif/yt-dlp`) — with cookie auth |
| AI analytics | Anthropic SDK (`@anthropic-ai/sdk`) — Claude for monthly IG audit |
| Image CDN (legacy) | Cloudinary (read-only for old images) |
| Disk storage | VPS local disk at `/home/sherif/data/ahmed-elakad/images/` |
| Web server | Nginx (serves `/media/` → disk images, reverse-proxies to Next.js) |
| Process manager | PM2 (`ahmed-elakad` process) |

---

## Folder Structure

```
Ahmed-Elakad/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Navbar + Footer)
│   │   ├── page.tsx                      # Home page
│   │   ├── about/page.tsx                # Designer bio + gallery
│   │   ├── bridal/
│   │   │   ├── page.tsx                  # Redirect to /bridal/all
│   │   │   └── [year]/page.tsx           # Bridal collection by year or "all"
│   │   ├── couture/
│   │   │   ├── page.tsx                  # Redirect to /couture/all
│   │   │   └── [year]/page.tsx           # Couture collection by year or "all"
│   │   ├── experience/
│   │   │   ├── page.tsx                  # Testimonials + videos
│   │   │   ├── InstagramEmbed.tsx        # IG embed component
│   │   │   ├── TestimonialsSection.tsx
│   │   │   └── VideosSection.tsx
│   │   ├── contact/page.tsx              # Booking enquiry form
│   │   ├── atelier/page.tsx              # Internal staff CRM (Arabic RTL)
│   │   ├── admin/
│   │   │   ├── page.tsx                  # Admin login
│   │   │   ├── layout.tsx                # Admin layout wrapper
│   │   │   └── dashboard/page.tsx        # Full CMS dashboard
│   │   └── api/
│   │       ├── auth/route.ts             # Login / logout
│   │       ├── content/route.ts          # GET/PUT site content JSON
│   │       ├── upload/route.ts           # POST file upload (images+video via Busboy+ffmpeg)
│   │       ├── upload/voice/route.ts     # POST voice note upload
│   │       ├── images/route.ts           # GET media library listing
│   │       ├── grab-url/route.ts         # POST fetch external image → local disk
│   │       ├── ig-video/route.ts         # POST download IG video via yt-dlp
│   │       ├── contact/route.ts          # POST contact form submission
│   │       ├── ad-enquiry/route.ts       # POST ad enquiry form submission
│   │       └── admin/
│   │           ├── analytics/route.ts    # GET/POST/DELETE monthly IG analytics + AI audit
│   │           ├── clients/route.ts      # CRUD for Atelier CRM clients
│   │           ├── messages/route.ts     # GET contact form submissions
│   │           ├── ad-enquiries/route.ts # GET ad enquiry submissions
│   │           ├── config/route.ts       # Admin password change
│   │           ├── cover/route.ts        # Set collection cover image
│   │           ├── reorder/route.ts      # Reorder collections
│   │           └── reorder-images/route.ts # Reorder images within a collection
│   ├── components/
│   │   ├── Navbar.tsx                    # Top navigation
│   │   ├── Footer.tsx                    # Footer
│   │   ├── MasonryGallery.tsx            # Responsive masonry image/video grid
│   │   ├── CollectionGrid.tsx            # Collection year grid
│   │   ├── AtelierForm.tsx               # 4-step booking enquiry form (public)
│   │   ├── AdInquiryPopup.tsx            # Modal enquiry form (?ref=ad traffic)
│   │   ├── ContactForm.tsx               # Legacy simple contact form (unused)
│   │   ├── LoadingScreen.tsx             # Animated loading overlay
│   │   ├── RealBridesCarousel.tsx        # Brides carousel component
│   │   └── (admin components inline in dashboard/page.tsx)
│   └── lib/
│       ├── content.ts                    # Read/write content.json (SiteContent type)
│       ├── clients.ts                    # Read/write clients.json (Client/Dress/Payment types)
│       ├── messages.ts                   # Read/write messages.json
│       ├── adEnquiries.ts                # Read/write ad-enquiries.json
│       ├── analytics.ts                  # Read/write analytics.json + InstagramPost types
│       ├── config.ts                     # Read/write admin password from config.json
│       ├── cloudinary.ts                 # Cloudinary client (legacy read-only)
│       ├── compressImage.ts              # Client-side canvas image compression
│       ├── atomicWrite.ts                # Atomic JSON file writes (write-then-rename)
│       └── utils.ts                      # Shared helpers
├── public/                               # Static assets (SVGs, icons)
├── next.config.ts                        # Next.js config (image domains, cache TTL)
├── tsconfig.json
├── package.json
└── .env.local                            # Secrets — never commit
```

**Data files (outside repo, VPS only):**
```
/home/sherif/data/ahmed-elakad/
├── config.json           # Admin password
├── content.json          # All editable site content
├── messages.json         # Contact form submissions
├── clients.json          # Atelier CRM client records
├── ad-enquiries.json     # Ad enquiry form submissions
├── analytics.json        # Monthly Instagram analytics data
├── images/               # All uploaded media (images + videos), ~1,700+ files
├── voices/               # Voice note recordings
└── ig-cookies.txt        # Instagram session cookies for yt-dlp (optional)
```

---

## Database

No database. All data is stored as JSON files on VPS disk:
- Content: `/home/sherif/data/ahmed-elakad/content.json`
- Clients: `/home/sherif/data/ahmed-elakad/clients.json`
- Messages: `/home/sherif/data/ahmed-elakad/messages.json`
- Ad enquiries: `/home/sherif/data/ahmed-elakad/ad-enquiries.json`
- Analytics: `/home/sherif/data/ahmed-elakad/analytics.json`
- Config (admin pw): `/home/sherif/data/ahmed-elakad/config.json`

Writes are atomic (write to `.tmp` file → rename) via `src/lib/atomicWrite.ts`.

Images are stored at `/home/sherif/data/ahmed-elakad/images/` and served by Nginx at `https://ahmedelakad.com/media/`.

---

## Environment Variables

In `.env.local` (never committed):

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Fallback admin password if `config.json` is missing |
| `CLOUDINARY_CLOUD_NAME` | Legacy Cloudinary listing (optional) |
| `CLOUDINARY_API_SECRET` | Legacy Cloudinary listing (optional) |
| `ANTHROPIC_API_KEY` | Claude API for analytics AI audit |

---

## Local Development

```bash
cd /home/sherif/sites/Ahmed-Elakad
npm install
npm run dev        # Dev server at http://localhost:3000
```

The dev server will use `.env.local` for secrets. Data files are read from `/home/sherif/data/ahmed-elakad/` (same path as production on this VPS).

---

## Deployment

**This site runs on VPS via PM2 — NOT Vercel.**

```bash
# Pull latest code
git -C /home/sherif/sites/Ahmed-Elakad pull origin main

# Build
cd /home/sherif/sites/Ahmed-Elakad && npm run build

# Restart the PM2 process
pm2 restart ahmed-elakad

# Check status / logs
pm2 status
pm2 logs ahmed-elakad
```

**Nginx config** serves `/media/` as a static alias to `/home/sherif/data/ahmed-elakad/images/` and reverse-proxies all other requests to the Next.js process (default port 3000).

**Do NOT deploy to Vercel** — the site requires local disk access and VPS-specific tools (yt-dlp, ffmpeg).

---

## Current Status

**LIVE** at https://ahmedelakad.com — operational as of 2026-07-24.

Recent changes (2026-07-24):
- `api/ig-video`: Added dual cookie auth (explicit `ig-cookies.txt` file preferred, fallback to Playwright Chromium profile). Uses output filename template so yt-dlp can choose the actual extension. Better error messages with stderr logging.
- `api/upload`: Rewrote to use Busboy streaming multipart parser. Added video upload support — any non-mp4/webm video is transcoded to mp4 via ffmpeg for browser compatibility. Removed the old `formData()` approach which had limits on large files.

---

## Known Issues

- Cloudinary images only appear in admin media library listing if `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_SECRET` are set in `.env.local`. Their public URLs continue to work without credentials.
- Instagram video download (`/api/ig-video`) requires either `/home/sherif/data/ahmed-elakad/ig-cookies.txt` or a logged-in Playwright Chromium profile at `/home/sherif/.cache/ms-playwright/mcp-chrome-d26cd27/Default`. Without one of these, downloads return HTTP 503.
- `npm run build` takes ~70 minutes on this VPS (Turbopack compilation + TypeScript check). Plan accordingly before restarting.

---

## Future Improvements

- Add video thumbnail generation on upload (ffmpeg frame extract)
- Paginate the admin media library (currently loads all ~1,700+ files at once)
- Add email notifications for new contact form submissions / ad enquiries
- Add authentication middleware to protect `/atelier` for staff-only access
- Image optimization pipeline (auto-compress on upload)

---

## Reusable Assets

- `src/lib/atomicWrite.ts` — atomic JSON write pattern, reusable in any file-based project
- `src/lib/compressImage.ts` — client-side canvas image compression before upload
- `src/components/MasonryGallery.tsx` — responsive masonry grid with lazy loading
- `src/components/AtelierForm.tsx` — reusable multi-step luxury enquiry form
- `src/components/AdInquiryPopup.tsx` — URL-param-triggered modal enquiry form
- `src/app/api/upload/route.ts` — Busboy streaming upload + ffmpeg video transcode pattern
- `src/app/api/ig-video/route.ts` — yt-dlp integration with cookie auth pattern
- `src/app/api/grab-url/route.ts` — server-side image fetch/scrape from external URLs
- `src/lib/clients.ts` — CRM data model (Client, Dress, Payment, VoiceNote)

---

## Lessons Learned

- Next.js `req.formData()` has a request body size limit that breaks large video uploads — Busboy streaming is the correct approach for production file uploads.
- yt-dlp Instagram downloads fail without auth cookies. Maintaining a cookies file (`ig-cookies.txt`) is more reliable than browser profile extraction.
- Atomic writes (write `.tmp` then rename) prevent data corruption on the JSON files used as a poor-man's database.
- `npm run build` on a low-resource VPS takes very long with Turbopack. Prefer running `npx tsc --noEmit` for quick type-checking.
- Image CDN on a VPS: Nginx `alias` for `/media/` with aggressive `Cache-Control` headers is simple and effective.

---

## WebistryDev Metadata

- **Category:** Portfolio / Fashion / Luxury Ecommerce
- **Complexity:** High
- **Template Candidate:** Yes — the admin CMS pattern, multi-step enquiry form, and masonry gallery are reusable for other fashion/portfolio clients
- **Priority:** Active (live production site, ongoing maintenance)
- **Reusable Modules:**
  - Multi-step luxury enquiry form (AtelierForm)
  - Admin CMS with JSON file storage
  - Masonry gallery with video support
  - Busboy streaming upload + ffmpeg video transcode
  - yt-dlp Instagram video download API
  - Atomic JSON write pattern
  - Client CRM (Atelier)
  - Anthropic AI analytics audit
- **Similar Projects:**
  - `/home/sherif/sites/Montelle` — luxury bridal ecommerce, similar admin CMS pattern
  - `/home/sherif/sites/zahrtelkhlig` — fashion ecommerce, similar gallery + product structure
  - `/home/sherif/sites/Qoya-Furniture` — luxury brand portfolio + contact form
