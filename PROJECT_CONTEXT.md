# Ahmed Elakad Couture — PROJECT_CONTEXT

## What It Does

Luxury Egyptian fashion designer website for Ahmed Elakad Couture. Public portfolio showcasing bridal and couture collections (2016–present), a client booking/contact channel, and an internal Atelier CRM for managing clients, orders, payments, and dress progress.

**Live URL:** https://ahmedelakad.com  
**GitHub:** https://github.com/SherifAsh93/Ahmed-Elakad  
**Local:** `/home/sherif/sites/Ahmed-Elakad`  
**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · VPS local disk storage · PM2 · Nginx

---

## Structure

```
Ahmed-Elakad/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Navbar + Footer)
│   │   ├── page.tsx                # Home page
│   │   ├── about/page.tsx
│   │   ├── bridal/[year]/page.tsx  # Bridal collections by year or "all"
│   │   ├── couture/[year]/page.tsx # Couture collections by year or "all"
│   │   ├── experience/page.tsx     # Testimonials + videos
│   │   ├── contact/page.tsx        # Contact/booking form
│   │   ├── atelier/page.tsx        # Internal CRM (Arabic RTL)
│   │   ├── admin/page.tsx          # Admin login
│   │   ├── admin/dashboard/page.tsx# Full CMS
│   │   └── api/                    # REST endpoints (auth, content, upload, clients)
│   ├── components/                 # Navbar, Footer, MasonryGallery, CollectionGrid, ContactForm
│   └── lib/                        # content.ts, clients.ts, messages.ts, cloudinary.ts
├── public/                         # Static SVGs
├── next.config.ts
├── package.json
└── .env.local                      # Secrets (never commit)
```

**Data files (outside repo, VPS only):**
```
/home/sherif/data/ahmed-elakad/
├── config.json      # Admin password
├── content.json     # All editable site content
├── messages.json    # Contact form submissions
├── clients.json     # Atelier CRM records
├── images/          # Uploaded images (~1,700+ files, ~655 MB)
└── voices/          # Voice note recordings
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — hero + CTAs |
| `/about` | Designer bio + gallery |
| `/bridal/[year]` | Bridal collections (year or "all") |
| `/couture/[year]` | Couture collections (year or "all") |
| `/experience` | Testimonials + client videos |
| `/contact` | Booking form |
| `/atelier` | Internal CRM (Arabic RTL, no login) |
| `/admin` | Admin login — password: `114891` |
| `/admin/dashboard` | Full CMS — content, images, messages |

---

## How to Run

```bash
cd /home/sherif/sites/Ahmed-Elakad
npm run dev        # Dev server → http://localhost:3000
npm run build      # Production build
pm2 restart ahmed-elakad   # Restart live server
pm2 logs ahmed-elakad      # View logs
```

**Required env vars in `.env.local`:**
- `ADMIN_PASSWORD` — admin login password
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_SECRET` — legacy image listing only (optional)

---

## How to Continue

- **Edit site content:** Use `/admin/dashboard` — no code changes needed
- **Add a collection:** Admin dashboard → Bridal/Couture → select year → add collection → upload images
- **Add a nav link:** `src/components/Navbar.tsx`
- **Change colors:** `src/app/globals.css`
- **New API route:** `src/app/api/[name]/route.ts`
- **Deploy:** `git pull && npm run build && pm2 restart ahmed-elakad`

**Image storage:** New uploads → VPS disk at `/home/sherif/data/ahmed-elakad/images/`, served by Nginx at `/media/`. Legacy images → Cloudinary (read-only, no new uploads).

---

## Known Issues

- Cloudinary images only appear in admin media library if `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_SECRET` are set; their public URLs still work without credentials.
- All pages use `force-dynamic` / `revalidate = 0` — no caching, always fresh reads from JSON files on disk.

---

## Next Steps

- No active issues as of 2026-06-14.
- Storage crisis resolved 2026-06-02 (moved to VPS local disk).
