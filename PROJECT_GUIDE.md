# Ahmed Elakad Couture — Project Guide

## Project Overview

A luxury Egyptian fashion designer website for Ahmed Elakad Couture. Serves as the public-facing portfolio for bridal and couture collections, a booking/contact channel, and an internal CRM for managing clients and orders.

**Live URL:** ahmedelakad.com  
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Cloudinary · Vercel

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
│   │       ├── images/route.ts     # GET Cloudinary image list
│   │       ├── upload/route.ts     # POST/DELETE Cloudinary images
│   │       ├── grab-url/route.ts   # POST import external image by URL
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
│   │   ├── cloudinary.ts           # Cloudinary SDK initialization
│   │   ├── utils.ts                # Image optimization helpers
│   │   └── compressImage.ts        # Client-side image compression before upload
│   └── data/                       # JSON data files (gitignored, on VPS disk)
│       ├── config.json             # Admin password
│       ├── content.json            # All editable site content
│       ├── messages.json           # Contact form submissions
│       └── clients.json            # Client/order records
├── public/                         # Static SVG icons
├── screenshots/                    # Documentation screenshots
├── next.config.ts                  # Next.js config (Cloudinary remote patterns)
├── tsconfig.json                   # TypeScript config (path alias @/* → src/*)
├── postcss.config.mjs              # Tailwind PostCSS config
├── eslint.config.mjs               # ESLint config
├── package.json
├── .env.local                      # Local dev secrets
├── .env.production                 # Production secrets
└── AGENTS.md                       # AI agent instructions
```

**Data files live outside the repo** at `/home/sherif/data/ahmed-elakad/` on the VPS and are read at runtime. They are not deployed to Vercel.

---

## Main Pages and Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Home: hero image + CTAs |
| `/about` | Public | Designer bio + portrait |
| `/bridal` | Public | Redirects to `/bridal/all` |
| `/bridal/[year]` | Public | Bridal collections by year (or "all") |
| `/couture` | Public | Redirects to `/couture/all` |
| `/couture/[year]` | Public | Couture collections by year (or "all") |
| `/contact` | Public | Contact info + booking form |
| `/atelier` | Semi-private | Client/order CRM (Arabic RTL) |
| `/admin` | Protected | Admin login |
| `/admin/dashboard` | Protected | Full CMS (content, images, messages) |

All public pages have `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` — no caching, always fresh data.

---

## Component Hierarchy

```
RootLayout (layout.tsx)
├── Navbar (receives content prop)
├── {page children}
│   ├── Home: hero section inline
│   ├── About: hero + bio inline
│   ├── Bridal/Couture: CollectionGrid
│   │   └── modal with MasonryGallery
│   ├── Contact: ContactForm
│   └── Atelier: full inline client CRM
└── Footer (receives content prop)

AdminLayout (admin/layout.tsx)
└── Admin pages (no Navbar/Footer)
    ├── Login page: inline form
    └── Dashboard: massive single-page CMS
        ├── Sidebar navigation
        ├── Home section editor
        ├── Bridal section editor
        ├── Couture section editor
        ├── About section editor
        ├── Contact section editor
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

### Cloudinary
All images are stored on Cloudinary in the `Ahmed Elakad` folder.

- Upload: `POST /api/upload` with base64 image data
- List: `GET /api/images` (cached 30s server-side)
- Delete: `DELETE /api/upload` with public_id
- Import by URL: `POST /api/grab-url` (for Instagram/external images)
- SDK: `cloudinary@2.9.0` initialized in `src/lib/cloudinary.ts`

### No other external APIs
- No email service (contact form saves to JSON only)
- No SMS/WhatsApp automation (WhatsApp links only)
- No payment processing (manual tracking in JSON)

---

## Authentication Flow

Simple single-password system, no user accounts:

1. User visits `/admin` and enters password
2. `POST /api/auth` compares submitted password against `ADMIN_PASSWORD` env var
3. On success: sets `admin_session=authenticated` cookie (httpOnly, 8-hour maxAge)
4. Protected API routes check `cookies.get("admin_session")?.value === "authenticated"`
5. Logout: `DELETE /api/auth` clears the cookie

Password can be changed via the Settings section of the admin dashboard, which writes to `config.json`.

---

## Deployment Process

### Production (Vercel)
```bash
# Auto-deploys on git push to main via Vercel GitHub integration
# Manual deploy:
npx vercel --prod
```

Vercel project: `ahmed-elakad` (org: `team_qJJXjiUXt2dFLD5C0UNDRPtb`)

**Important:** The JSON data files (`content.json`, `clients.json`, etc.) live on the VPS at `/home/sherif/data/ahmed-elakad/`, not on Vercel. This means the site **must** run on the VPS (via PM2 + Next.js server) for the data to be accessible, despite being linked to Vercel.

### Local Development
```bash
cd /home/sherif/sites/Ahmed-Elakad
npm run dev     # http://localhost:3000
npm run build   # Production build
npm start       # Start production server
```

### VPS (PM2)
The site runs as a PM2 process on the VPS, served via Nginx reverse proxy.

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

**Images not loading:**
- Check Cloudinary credentials in `.env.local` / `.env.production`
- Verify `CLOUDINARY_FOLDER` matches the folder name on Cloudinary
- Check `next.config.ts` remote patterns include `**.cloudinary.com`

**Admin login not working:**
- Verify `ADMIN_PASSWORD` in `.env.local` matches what you're entering
- Check `/home/sherif/data/ahmed-elakad/config.json` for current password
- Clear browser cookies and try again

**Data changes not persisting:**
- Data files are at `/home/sherif/data/ahmed-elakad/` — check write permissions
- Run `ls -la /home/sherif/data/ahmed-elakad/` to verify files exist

**Build errors:**
- Run `npm run lint` to check TypeScript/ESLint errors
- Ensure all env vars are set (check `.env.local` exists)

**Atelier page not loading client data:**
- Check `/home/sherif/data/ahmed-elakad/clients.json` exists and is valid JSON
- Use `node -e "JSON.parse(require('fs').readFileSync('/home/sherif/data/ahmed-elakad/clients.json','utf8'))"` to validate

**Cloudinary upload failing:**
- Check `CLOUDINARY_API_SECRET` is correct
- Cloudinary free tier has storage limits (~25GB) — check usage at cloudinary.com dashboard
