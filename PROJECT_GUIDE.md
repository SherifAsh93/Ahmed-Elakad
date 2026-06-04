# Ahmed Elakad Couture — Project Guide

## Project Overview

A luxury Egyptian fashion designer website for Ahmed Elakad Couture. Serves as the public-facing portfolio for bridal and couture collections, a booking/contact channel, and an internal CRM for managing clients and orders.

**Live URL:** https://ahmedelakad.com  
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · VPS local disk storage · PM2 · Nginx

---

## Purpose and Business Goals

- Showcase bridal and couture collections (2016–2026) with high-quality galleries
- Allow prospective clients to contact and book appointments
- Provide an admin CMS to edit all site content without code changes
- Track clients, orders, dress progress, payments, and appointments (internal Atelier dashboard)

---

## Complete Folder Structure

```
Ahmed-Elakad/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout: wraps all public pages in Navbar + Footer
│   │   ├── page.tsx                # Home page (hero + CTAs)
│   │   ├── globals.css             # Global Tailwind base styles
│   │   ├── about/page.tsx          # About designer page
│   │   ├── bridal/
│   │   │   ├── page.tsx            # Redirects to /bridal/all
│   │   │   └── [year]/page.tsx     # Bridal collections filtered by year (or "all")
│   │   ├── couture/
│   │   │   ├── page.tsx            # Redirects to /couture/all
│   │   │   └── [year]/page.tsx     # Couture collections filtered by year (or "all")
│   │   ├── experience/page.tsx     # Experience page (testimonials + videos + CTA)
│   │   ├── contact/page.tsx        # Contact page with form
│   │   ├── atelier/page.tsx        # Client/order management (Arabic, RTL)
│   │   ├── admin/
│   │   │   ├── layout.tsx          # Admin layout: no Navbar/Footer
│   │   │   ├── page.tsx            # Admin login
│   │   │   └── dashboard/page.tsx  # Full CMS dashboard (143KB)
│   │   └── api/
│   │       ├── auth/route.ts       # POST=login, DELETE=logout
│   │       ├── contact/route.ts    # POST contact form submission
│   │       ├── content/route.ts    # GET/POST site content JSON
│   │       ├── images/route.ts     # GET image list (local VPS + legacy Cloudinary)
│   │       ├── upload/
│   │       │   ├── route.ts        # POST/DELETE images → VPS disk
│   │       │   └── voice/route.ts  # POST voice recordings → VPS disk
│   │       ├── grab-url/route.ts   # POST import external image by URL → VPS disk
│   │       └── admin/
│   │           ├── clients/route.ts   # Full CRUD: clients, payments, dresses
│   │           ├── messages/route.ts  # GET/DELETE/PATCH contact messages
│   │           └── config/route.ts    # PUT change admin password
│   ├── components/
│   │   ├── Navbar.tsx              # Responsive navigation with mobile hamburger
│   │   ├── Footer.tsx              # Footer with social links
│   │   ├── MasonryGallery.tsx      # Responsive masonry grid with lightbox
│   │   ├── CollectionGrid.tsx      # Collection cards with modal gallery
│   │   └── ContactForm.tsx         # Contact/booking form
│   ├── lib/
│   │   ├── content.ts              # Read/write content.json
│   │   ├── messages.ts             # Read/write messages.json
│   │   ├── clients.ts              # Client CRM logic (read/write clients.json)
│   │   ├── config.ts               # Admin password read/write (config.json)
│   │   ├── cloudinary.ts           # Cloudinary SDK init (legacy image management only)
│   │   ├── utils.ts                # Image optimization helpers
│   │   └── compressImage.ts        # Client-side image compression before upload
│   └── data/                       # (gitignored) Pointer to VPS data location
├── public/                         # Static SVG icons and assets
├── next.config.ts                  # Next.js config (remote image patterns for Cloudinary + ahmedelakad.com)
├── tsconfig.json                   # TypeScript config (path alias @/* → src/*)
├── postcss.config.mjs              # Tailwind PostCSS config
├── eslint.config.mjs               # ESLint config
├── package.json
├── .env.local                      # Local dev secrets (never commit)
└── AGENTS.md                       # AI agent instructions
```

**Data files live outside the repo** at `/home/sherif/data/ahmed-elakad/` on the VPS and are read at runtime:
```
/home/sherif/data/ahmed-elakad/
├── config.json      # Admin password
├── content.json     # All editable site content + image URLs
├── messages.json    # Contact form submissions
├── clients.json     # Client/order CRM records
├── images/          # Uploaded images (~1,700+ files, ~655 MB)
└── voices/          # Voice note recordings for Atelier
```

---

## Main Pages and Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Home: hero image + CTAs |
| `/about` | Public | Designer bio + portrait + gallery |
| `/bridal` | Public | Redirects to `/bridal/all` |
| `/bridal/[year]` | Public | Bridal collections by year (or "all") |
| `/couture` | Public | Redirects to `/couture/all` |
| `/couture/[year]` | Public | Couture collections by year (or "all") |
| `/experience` | Public | Testimonials + client videos + CTA |
| `/contact` | Public | Contact info + booking form + international brides |
| `/atelier` | Semi-private | Client/order CRM (Arabic RTL, no password) |
| `/admin` | Protected | Admin login (password: 114891) |
| `/admin/dashboard` | Protected | Full CMS (content, images, messages) |

All public pages have `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` — no caching, always fresh data.

---

## Component Hierarchy

```
RootLayout (layout.tsx)
├── Navbar (receives content prop)
├── {page children}
│   ├── Home: hero section inline
│   ├── About: hero + bio + gallery inline
│   ├── Bridal/Couture: CollectionGrid
│   │   └── modal with MasonryGallery
│   ├── Experience: testimonials + videos + CTA inline
│   ├── Contact: ContactForm
│   └── Atelier: full inline client CRM (RTL, Arabic)
└── Footer (receives content prop)

AdminLayout (admin/layout.tsx)
└── Admin pages (no Navbar/Footer)
    ├── Login page: inline form
    └── Dashboard: massive single-page CMS
        ├── Sidebar navigation
        ├── Home / About / Bridal / Couture / Experience / Contact editors
        ├── Media Library (browse + upload + grab-by-URL)
        ├── Messages viewer
        └── Settings (password change)
```

---

## State Management Approach

No external state library. Uses React built-ins only:

- **`useState`** — Form inputs, modal open/close, filters, pagination
- **`useEffect`** — Fetch data on mount, keyboard event listeners
- **`useCallback`** — Memoize event handlers
- **`useRef`** — Logo tap counter (Easter egg to admin), timers
- **`useRouter` / `usePathname`** — Navigation and active link detection

Data flow: Server Components fetch content JSON → pass as props to Client Components → Client Components manage local UI state.

---

## API Integrations

### Image Storage (VPS Local Disk — primary)

All new image uploads (since 2026-06-02) are saved directly to VPS disk and served by Nginx.

- Upload: `POST /api/upload` with multipart form data → saves to `/data/.../images/`
- List (local): `GET /api/images` returns local images first, then legacy Cloudinary
- Delete (local): `DELETE /api/upload` with `{ url: "https://ahmedelakad.com/media/..." }` → unlinks file
- Import by URL: `POST /api/grab-url` → fetches external image, saves to VPS disk, returns `/media/` URL
- Voice upload: `POST /api/upload/voice` → saves to `/data/.../voices/`, returns `/voices/` URL

Nginx serves `/media/` and `/voices/` directly from disk (not through Next.js), with 1-year immutable caching.

### Cloudinary (legacy — pre-June 2026 images only)

The Cloudinary SDK (`cloudinary@2.9.0`) is still in use for:
- `GET /api/images`: includes legacy Cloudinary images in the media library listing
- `DELETE /api/upload` with a `res.cloudinary.com` URL: calls `cloudinary.uploader.destroy()` to remove from Cloudinary

No new images are uploaded to Cloudinary. Cloudinary credentials are optional — omitting them means legacy images still display (their URLs still work), but they won't appear in the admin media library.

### No other external APIs
- No email service (contact form saves to JSON only)
- No SMS/WhatsApp automation (WhatsApp links only)
- No payment processing (manual tracking in JSON)

---

## Authentication Flow

Simple single-password system, no user accounts:

1. User visits `/admin` and enters password
2. `POST /api/auth` compares submitted password against `ADMIN_PASSWORD` env var
3. On success: sets `admin_session=authenticated` cookie (httpOnly, 30-day maxAge, auto-renews on each save)
4. Protected API routes check `cookies.get("admin_session")?.value === "authenticated"`
5. Logout: `DELETE /api/auth` clears the cookie

Password can be changed via the Settings section of the admin dashboard, which writes to `config.json`.

---

## Deployment Process

### Production (VPS with PM2)
```bash
cd /home/sherif/sites/Ahmed-Elakad
git pull
npm run build
pm2 restart ahmed-elakad
pm2 logs ahmed-elakad --lines 20
```

GitHub repo: `SherifAsh93/Ahmed-Elakad`  
PM2 process name: `ahmed-elakad`  
Port: `3000` (proxied by Nginx)

### Local Development
```bash
cd /home/sherif/sites/Ahmed-Elakad
npm run dev     # http://localhost:3000
npm run build   # Production build
npm start       # Start production server
```

---

## Common Modification Points

### Change site content (text, images)
Use the admin dashboard at `/admin/dashboard`. No code changes needed.

### Add a new collection
Admin dashboard → Bridal or Couture section → select year → add collection → upload images.

### Add a new nav link
Edit `src/components/Navbar.tsx` — the links array near the top.

### Change the color scheme
Edit `src/app/globals.css` — Tailwind CSS variables.

### Add a new API endpoint
Create `src/app/api/[name]/route.ts` with named exports `GET`, `POST`, etc.

### Add a new page
Create `src/app/[pagename]/page.tsx`. Add to Navbar if needed.

### Modify client CRM fields
Edit `src/app/atelier/page.tsx` (UI) and `src/lib/clients.ts` (data logic) and `src/app/api/admin/clients/route.ts` (API).

---

## Troubleshooting Guide

**Images not loading (local /media/ URLs):**
- Check Nginx is running: `sudo nginx -t && sudo systemctl status nginx`
- Verify files exist: `ls /home/sherif/data/ahmed-elakad/images/`
- Check Nginx config: `/etc/nginx/sites-available/ahmedelakad.com` — `/media/` alias must point to the images dir

**Legacy Cloudinary images not showing in media library:**
- Check `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_SECRET` are set in `.env.local`
- The images themselves still work (their URLs are valid) — only the library listing needs credentials

**Admin login not working:**
- Verify `ADMIN_PASSWORD` in `.env.local` matches what you're entering (default: `114891`)
- Check `/home/sherif/data/ahmed-elakad/config.json` for current stored password
- Clear browser cookies and try again

**Data changes not persisting:**
- Data files are at `/home/sherif/data/ahmed-elakad/` — check write permissions
- Run `ls -la /home/sherif/data/ahmed-elakad/` to verify files exist and are writable

**Upload failing:**
- Check directory exists and is writable: `ls -la /home/sherif/data/ahmed-elakad/images/`
- Check disk space: `df -h /home/sherif/data/`
- Check PM2 logs: `pm2 logs ahmed-elakad --lines 50`

**Build errors:**
- Run `npm run lint` to check TypeScript/ESLint errors
- Ensure all env vars are set (check `.env.local` exists)

**Atelier page not loading client data:**
- Check `/home/sherif/data/ahmed-elakad/clients.json` exists and is valid JSON
- Validate: `node -e "JSON.parse(require('fs').readFileSync('/home/sherif/data/ahmed-elakad/clients.json','utf8'))"`

**Site down / PM2 crash:**
```bash
pm2 status ahmed-elakad
pm2 logs ahmed-elakad --lines 50
pm2 restart ahmed-elakad
```
