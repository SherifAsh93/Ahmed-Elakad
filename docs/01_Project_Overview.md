# Project Overview — Ahmed Elakad Couture House

## What This Project Is

Ahmed Elakad Couture House is the digital presence for an Egyptian luxury fashion designer. The site serves three distinct audiences through three completely separate surfaces:

1. **Public website** — Brand showcase for bridal and couture collections, about page, experience/testimonials, contact. All content is CMS-driven and editable without deployment.
2. **Admin CMS** (`/admin/dashboard`) — Full content management system. Accessible only via hidden entry (triple-tap logo) + password. Manages site content, collections, images, contact messages, and client records.
3. **Atelier CRM** (`/atelier`) — Internal client management interface in Arabic RTL. **No authentication required** — it is protected by obscurity (no link in the public nav). Used by atelier staff to manage client records, payments, appointments, dress orders, and voice notes.

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.3 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 (strict mode) |
| Styling | Tailwind CSS | ^4 (PostCSS plugin) |
| Runtime | Node.js | 24 (on VPS) |
| Storage | Flat-file JSON | — |
| Media server | Nginx | serving `/media/` |
| Process manager | PM2 | — |
| Legacy image CDN | Cloudinary | ^2.9.0 (read-only) |
| File upload parsing | busboy | ^1.6.0 |
| Video conversion | FFmpeg | `/usr/bin/ffmpeg` |
| Video download | yt-dlp | `/home/sherif/yt-dlp` |

**No database. No ORM. No authentication middleware. No ISR.**

---

## Annotated Folder Tree

```
Ahmed-Elakad/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout — loads fonts async, renders Navbar + Footer with content from JSON
│   │   ├── page.tsx                 # Home page — hero, collection grid, real brides carousel, CTA
│   │   ├── globals.css              # Tailwind v4 @import + all CSS variables + all custom classes + @keyframes
│   │   ├── about/page.tsx           # Designer bio, portrait, side image, gallery
│   │   ├── bridal/
│   │   │   ├── page.tsx             # Redirects to /bridal/all
│   │   │   └── [year]/page.tsx      # Year tab nav + CollectionGrid; generateStaticParams for 2022-2026 + all
│   │   ├── couture/
│   │   │   ├── page.tsx             # Redirects to /couture/all
│   │   │   └── [year]/page.tsx      # Same pattern as bridal
│   │   ├── contact/page.tsx         # Contact form + location info
│   │   ├── experience/
│   │   │   ├── page.tsx             # Experience hub — composes TestimonialsSection, VideosSection, InstagramEmbed
│   │   │   ├── TestimonialsSection.tsx  # Client testimonials grid (server component)
│   │   │   ├── VideosSection.tsx    # Video embeds from content.json (server component)
│   │   │   └── InstagramEmbed.tsx   # Instagram embed helper (client component)
│   │   ├── atelier/page.tsx         # Full-page Arabic RTL CRM — "use client", no auth gate, 1300+ lines
│   │   ├── admin/
│   │   │   ├── layout.tsx           # Admin layout — hides Navbar/Footer by returning children only
│   │   │   ├── page.tsx             # Redirect to /admin/dashboard
│   │   │   └── dashboard/page.tsx   # Full CMS — "use client", fetches all data on mount, all edit forms
│   │   └── api/
│   │       ├── auth/route.ts        # GET (check session) / POST (login) / DELETE (logout)
│   │       ├── contact/route.ts     # POST — saves contact form submission to messages.json (no auth)
│   │       ├── content/route.ts     # GET (public) / POST (auth) — reads/writes content.json
│   │       ├── images/route.ts      # GET — lists local + Cloudinary images, 30s in-memory cache
│   │       ├── upload/route.ts      # POST (auth) — upload image/video via busboy; DELETE (auth) — delete file
│   │       ├── upload/voice/route.ts # POST — audio upload, no auth check (atelier staff access)
│   │       ├── grab-url/route.ts    # POST (auth) — fetches remote image URL and saves locally
│   │       ├── ig-video/route.ts    # POST (auth) — downloads Instagram video via yt-dlp
│   │       └── admin/
│   │           ├── clients/route.ts  # GET/POST/PUT/DELETE — full client CRUD + action dispatch
│   │           ├── config/route.ts   # PUT (auth) — change admin password
│   │           ├── cover/route.ts    # POST (auth) — set collection cover image index
│   │           ├── messages/route.ts # GET/DELETE/PATCH (auth) — contact message management
│   │           ├── reorder/route.ts  # POST (auth) — reorder collections within a year
│   │           └── reorder-images/route.ts # POST (auth) — reorder images within a collection
│   ├── components/
│   │   ├── Navbar.tsx               # "use client" — fixed header, triple-tap logo → /admin, transparent on home hero
│   │   ├── Footer.tsx               # Social links from content.json, copyright
│   │   ├── CollectionGrid.tsx       # Masonry gallery with lightbox; admin edit mode adds drag-to-reorder + delete
│   │   ├── MasonryGallery.tsx       # Pure masonry layout with lightbox (used by CollectionGrid internally)
│   │   ├── RealBridesCarousel.tsx   # Horizontal snap-scroll carousel of featured bride images
│   │   ├── ContactForm.tsx          # "use client" — contact form, posts to /api/contact
│   │   └── LoadingScreen.tsx        # "use client" — overlay that fades on window.load event
│   ├── lib/
│   │   ├── atomicWrite.ts           # atomicWriteJSON() — writes .tmp then renames; POSIX atomic
│   │   ├── content.ts               # SiteContent type + getContent() + saveContent() — reads content.json
│   │   ├── clients.ts               # Client type + full CRUD: getClients, addClient, updateClient, deleteClient, payment/dress/voice ops
│   │   ├── messages.ts              # ContactMessage type + addMessage, getMessages, deleteMessage, markMessageRead
│   │   ├── config.ts                # getAdminPassword() / setAdminPassword() — reads/writes config.json
│   │   ├── utils.ts                 # optimizeImage() + thumbnailImage() — routes media URLs through /_next/image
│   │   ├── cloudinary.ts            # Cloudinary v2 config from env vars; exports CLOUDINARY_FOLDER
│   │   └── compressImage.ts         # Browser-side canvas compression before upload (1600px max, 0.82 JPEG quality)
│   └── data/                        # Checked-in fallback data (overridden by /home/sherif/data/ahmed-elakad/ on VPS)
│       ├── content.json             # Site content (checked-in starter; real data lives in /home/sherif/data/)
│       ├── clients.json             # Client records starter
│       ├── messages.json            # Messages starter
│       └── config.json              # Admin password starter
├── public/                          # Static assets served directly by Next.js
├── next.config.ts                   # Image domains, formats AVIF+WebP, 30-day cache TTL, device sizes
├── postcss.config.mjs               # @tailwindcss/postcss plugin (Tailwind v4 mode)
├── tsconfig.json                    # strict: true, @/* → ./src/*, moduleResolution: bundler
└── package.json                     # Dependencies (see 03_Tech_Stack.md)
```

---

## Modules

### Content Management
- **Entry point:** `src/lib/content.ts`
- All site text and configuration lives in a single `content.json` at `/home/sherif/data/ahmed-elakad/content.json`.
- The `SiteContent` interface covers every editable field across every page.
- Reads use `fs.readFileSync` synchronously in an async wrapper (`getContent`).
- Writes go through `atomicWriteJSON` to prevent partial-write corruption.
- After a POST to `/api/content`, `revalidatePath("/", "layout")` is called so Next.js clears any cached RSC renders.

### Image Management
- **Entry point:** `src/app/api/images/route.ts`, `src/app/api/upload/route.ts`, `src/lib/utils.ts`
- New images upload to VPS disk at `/home/sherif/data/ahmed-elakad/images/`.
- Nginx serves that directory at `https://ahmedelakad.com/media/`.
- Legacy images from Cloudinary are still listed alongside local images (read-only).
- `optimizeImage()` converts any `https://ahmedelakad.com/media/` or Cloudinary URL into a `/_next/image?url=...&w=1200&q=75` URL for automatic resize + format conversion.
- PNG files are **not** routed through `/_next/image` (to preserve transparency).

### Collections
- **Data path:** `content.bridal.years[year].collections[]` and `content.couture.years[year].collections[]`
- Each `Collection` has `id`, optional `name`, `images: string[]`, and optional `coverIndex`.
- Years 2022–2026 are hardcoded in `ALL_YEARS` in `bridal/[year]/page.tsx` and `couture/[year]/page.tsx`. Adding a year requires editing this constant plus the `generateStaticParams` list.
- Reordering collections uses `/api/admin/reorder` (full replacement of `collections[]` for a year).
- Reordering images within a collection uses `/api/admin/reorder-images`.

### Client Management (Atelier CRM)
- **Entry point:** `src/lib/clients.ts`, `src/app/api/admin/clients/route.ts`, `src/app/atelier/page.tsx`
- Clients stored as a JSON array in `/home/sherif/data/ahmed-elakad/clients.json`.
- Primary key: phone number digits only (`normalizePhone()` strips all non-digits).
- `autoStatus()` automatically derives `status` from payment progress: pending → active (any payment) → completed (fully paid).
- The `PUT /api/admin/clients` route uses an action dispatch pattern: a single endpoint handles 11 sub-operations via an `action` field.
- Atelier page polls the same `/api/admin/clients` endpoint every 30 seconds via `AtelierCalendar`'s `setInterval`.

### Authentication
- **Entry point:** `src/app/api/auth/route.ts`, `src/lib/config.ts`
- Cookie `admin_session=authenticated` with 30-day `maxAge`.
- Password stored in plaintext in `config.json`.
- No middleware — every protected API handler calls `cookies().get("admin_session")?.value === "authenticated"` inline.
- Entry: triple-tap the logo within 600ms to navigate to `/admin`.
- `/atelier` has **no auth gate** — protected by obscurity only.
