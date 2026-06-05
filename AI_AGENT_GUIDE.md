# Ahmed Elakad Couture — AI Agent Guide

## Architecture Overview

This is a **Next.js 16 App Router** application running on a VPS. Unlike typical Next.js apps, it uses **JSON files on disk as a database** rather than a SQL database, and **VPS local disk** as the primary image storage (not a cloud service).

```
Browser → Nginx (port 80/443)
    ├── /media/*   → /home/sherif/data/ahmed-elakad/images/  (static files, no Next.js)
    ├── /voices/*  → /home/sherif/data/ahmed-elakad/voices/  (static files, no Next.js)
    └── /*         → Next.js server (port 3000)
                        ├── JSON files on disk (content, clients, messages, config)
                        └── Cloudinary API (read-only, legacy image management only)
```

**Key constraint:** The app MUST run as a persistent Node.js server (via PM2), not Vercel serverless, because serverless functions cannot persist file writes between invocations.

---

## Important Files

| Priority | File | What it does |
|----------|------|-------------|
| Critical | `src/lib/content.ts` | Read/write all site content (content.json) |
| Critical | `src/lib/clients.ts` | Client CRM logic (clients.json) |
| Critical | `src/lib/messages.ts` | Contact form submissions (messages.json) |
| Critical | `src/lib/config.ts` | Admin password management (config.json) |
| Critical | `src/lib/atomicWrite.ts` | Atomic JSON write helper (used by all above) |
| Critical | `src/app/api/upload/route.ts` | Image upload/delete → VPS disk |
| Critical | `src/app/api/images/route.ts` | Image listing (VPS + legacy Cloudinary) |
| High | `src/app/admin/dashboard/page.tsx` | CMS UI (143KB, monolithic) |
| High | `src/app/atelier/page.tsx` | Client management UI (RTL Arabic) |
| High | `src/app/api/*/route.ts` | All backend endpoints |
| Medium | `src/app/api/grab-url/route.ts` | Fetch external image by URL → VPS disk |
| Medium | `src/app/api/upload/voice/route.ts` | Voice note upload → VPS disk |
| Medium | `src/lib/cloudinary.ts` | Cloudinary SDK init (legacy list/delete only) |
| Medium | `src/components/MasonryGallery.tsx` | Gallery with lightbox |
| Medium | `src/components/CollectionGrid.tsx` | Collection cards + modal |
| Config | `next.config.ts` | Image remote patterns (ahmedelakad.com + Cloudinary) |
| Config | `.env.local` | Secrets (never commit) |

**Data files (not in repo, on VPS disk):**
- `/home/sherif/data/ahmed-elakad/content.json` — All site text and image URLs
- `/home/sherif/data/ahmed-elakad/clients.json` — CRM records
- `/home/sherif/data/ahmed-elakad/messages.json` — Contact form submissions
- `/home/sherif/data/ahmed-elakad/config.json` — Admin password
- `/home/sherif/data/ahmed-elakad/images/` — Uploaded images (~1,700+ files, ~655 MB)
- `/home/sherif/data/ahmed-elakad/voices/` — Voice note audio files

**Scripts (in repo, operated on VPS):**
- `scripts/backup-ahmed-elakad.sh` — Daily backup to Windows D: drive via NoMachine mount
- `scripts/health-check-ahmed-elakad.sh` — Full health check (JSON, disk, PM2, Nginx, backup)
- `logs/backup.log` — Local backup log (always available even if D: drive offline)

---

## Image Storage — Critical to Understand

The site uses **two image storage systems**. New and old images coexist:

### New images (since 2026-06-02) — VPS local disk
- Stored at: `/home/sherif/data/ahmed-elakad/images/`
- Served by Nginx at: `https://ahmedelakad.com/media/{filename}`
- Filename format: `{timestamp}-{5randomchars}.{ext}`
- Upload API: `POST /api/upload` (multipart form)
- Delete API: `DELETE /api/upload` with `{ url: "https://ahmedelakad.com/media/..." }`

### Legacy images (before 2026-06-02) — Cloudinary CDN
- URL pattern: `https://res.cloudinary.com/dzppk5ylt/image/upload/...`
- These URLs are stored in `content.json` and still work
- Delete: `DELETE /api/upload` with a Cloudinary URL → calls `cloudinary.uploader.destroy()`
- Cloudinary credentials are optional — omitting them only hides legacy images from the media library; they still display on the public site

Image URLs are stored **as full strings** in `content.json` — the code never distinguishes between local and Cloudinary at render time, it just uses the URL directly.

---

## Atomic Writes — How All JSON Saves Work

All four lib files (`content.ts`, `clients.ts`, `messages.ts`, `config.ts`) write JSON via `atomicWriteJSON()` from `src/lib/atomicWrite.ts`:

```typescript
// Under the hood:
fs.writeFileSync(`${filePath}.tmp`, JSON.stringify(data, null, 2));
fs.renameSync(`${filePath}.tmp`, filePath);   // atomic on Linux (POSIX rename)
```

**Never use `fs.writeFileSync(targetFile, ...)` directly in lib files** — always go through `atomicWriteJSON`. A direct write leaves a window where a reader could see a zero-byte or partial file if the process crashes.

---

## Backup System

A cron job at 03:00 daily backs up all Ahmed-Elakad data to the Windows D: drive via the NoMachine sshfs mount.

**Mount path:** `/home/sherif/Desktop/D on Player (NoMachine)/`  
**Destination:** `…/Development/01-Projects/ahmed-elakad/backup/YYYY-MM-DD_HH-MM-SS/`

The backup script **never touches site data or the PM2 process**. If the D: drive is offline, the script logs a warning and exits cleanly (no cron mail, no site impact).

To run a manual backup: `bash /home/sherif/sites/Ahmed-Elakad/scripts/backup-ahmed-elakad.sh`  
To check backup status + full health: `bash /home/sherif/sites/Ahmed-Elakad/scripts/health-check-ahmed-elakad.sh`

---

## Coding Conventions

- **TypeScript strict mode** — All props and API payloads must be typed
- **Path alias `@/*`** maps to `src/*` — Use `@/lib/...`, `@/components/...`
- **Server components by default** — Only add `"use client"` when interactivity is needed
- **No database ORM** — File I/O done with Node.js `fs` module via `src/lib/*.ts` helpers
- **Tailwind CSS v4** — No `tailwind.config.js`, uses PostCSS plugin; utility classes only
- **API routes** return JSON with appropriate status codes (200, 201, 401, 404, 500)
- **`force-dynamic`** on all pages (`export const dynamic = 'force-dynamic'`) — no caching
- **`revalidate = 0`** on pages — always fetch fresh data

---

## Where to Modify Common Features

### Change site text/images
→ Admin dashboard at `/admin/dashboard` (no code needed)  
→ Or directly edit `/home/sherif/data/ahmed-elakad/content.json`

### Add a new nav link
→ `src/components/Navbar.tsx` — find the links array and add an entry

### Add a new gallery type (e.g., "Accessories")
1. Add a new route folder: `src/app/accessories/[year]/page.tsx` (copy bridal pattern)
2. Add a section to `content.json` schema
3. Update `src/lib/content.ts` type definitions
4. Update `src/app/api/content/route.ts` to handle the new section
5. Add admin UI section in `src/app/admin/dashboard/page.tsx`
6. Add nav link to `src/components/Navbar.tsx`

### Add a new client CRM field
1. Update `src/app/atelier/page.tsx` — add input in the edit modal and display in card
2. Update `src/lib/clients.ts` — add field to the Client TypeScript type
3. Update `src/app/api/admin/clients/route.ts` — handle new field in PUT handler

### Change admin password logic
→ `src/lib/config.ts` — `getAdminPassword()` and `setAdminPassword()`  
→ `src/app/api/auth/route.ts` — GET (check session), POST (login), DELETE (logout)  
→ `src/app/api/admin/config/route.ts` — password change handler

### Add a new API endpoint
Create `src/app/api/[name]/route.ts` with exported functions:
```typescript
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

---

## Common Pitfalls

### 1. Direct `fs.writeFileSync` on JSON data files
Never write `fs.writeFileSync(SOME_JSON_FILE, ...)` directly in lib files. Always use `atomicWriteJSON()` from `@/lib/atomicWrite`. A direct write leaves a corruption window if the process crashes between open and flush.

### 2. Trying to write data on Vercel
The JSON data files and image directories are at `/home/sherif/data/ahmed-elakad/` — this path only exists on the VPS. Vercel serverless functions will throw ENOENT errors on any write operation. Always test data writes on the VPS, not via `vercel dev`.

### 3. Confusing old (Cloudinary) and new (local) image URLs
The `DELETE /api/upload` route handles both URL types:
- If URL starts with `https://ahmedelakad.com/media/` → deletes file from disk
- If URL is a Cloudinary URL → extracts `public_id` and calls `cloudinary.uploader.destroy()`

Never call Cloudinary's destroy API with a local `/media/` URL.

### 4. Content JSON structure changes
If you add a new top-level key to `content.json`, you must also update the TypeScript type in `src/lib/content.ts`. The type mismatch won't cause a runtime crash but will cause TypeScript build errors.

### 5. Admin authentication — how the whole flow works
The admin panel lives at `/admin/dashboard`. There is **no separate login page** — `/admin` just redirects there.

The dashboard mounts with `isLocked = true` and immediately calls `GET /api/auth`:
- If the session cookie is valid → `setIsLocked(false)` + `fetchData()`
- If invalid/missing → stays locked (shows full-screen dark overlay with password form)
- On correct password → POST `/api/auth`, cookie set, `setIsLocked(false)`, `fetchData()`
- Logout (TERMINATE SESSION) → DELETE `/api/auth`, `setIsLocked(true)`, clears content

API routes that require admin check for the cookie:
```typescript
const cookieStore = await cookies();
const session = cookieStore.get("admin_session")?.value;
if (session !== "authenticated") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
Do NOT change this to a different pattern without updating ALL protected routes.

### 6. Large dashboard file
`src/app/admin/dashboard/page.tsx` is 143KB. Make targeted edits — do not restructure the entire component. Edit only the specific section/function you need to change.

### 7. Image hostnames in next.config.ts
If you use a new image hostname with `<Image>` from next/image, add it to `next.config.ts`:
```typescript
remotePatterns: [
  { protocol: "https", hostname: "**.cloudinary.com" },
  { protocol: "https", hostname: "ahmedelakad.com" },
]
```

### 8. Disk space
The images directory is ~655 MB and growing. Before large uploads, check available disk space:
```bash
df -h /home/sherif/data/
```

---

## Project-Specific Patterns

### Pattern: Content reads with fallback
```typescript
// src/lib/content.ts
export async function getContent(): Promise<SiteContent> {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}
```
Always call `getContent()` at the top of Server Component pages. Don't cache it in a module variable — force fresh reads.

### Pattern: API auth check
```typescript
// At the start of every admin API route handler:
const cookieStore = await cookies();
const session = cookieStore.get("admin_session")?.value;
if (session !== "authenticated") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Pattern: Content update (merge flow)
```typescript
// Admin edits → POST /api/content with full content object
// Route handler:
const current = await getContent();
const updated = { ...current, ...partial };
await saveContent(updated);
```
Always merge with existing content to avoid overwriting unrelated sections.

### Pattern: Image URL stored in JSON
Images are stored as full URLs in JSON files. When displaying with `<img>` or `<Image>`:
- Local: `https://ahmedelakad.com/media/1780416174964-7dqc8.jpg` → served by Nginx
- Legacy: `https://res.cloudinary.com/dzppk5ylt/image/upload/...` → served by Cloudinary CDN

Both are used directly — no transformation needed at render time.

---

## Safe Areas for Modifications

These areas are low-risk to modify:

- `src/components/Navbar.tsx` — Adding links, changing styling
- `src/components/Footer.tsx` — Layout and style changes
- `src/app/globals.css` — CSS/Tailwind variable changes
- `src/app/about/page.tsx` — Layout changes (content comes from JSON)
- `src/app/contact/page.tsx` — Layout changes (content from JSON)
- `src/components/ContactForm.tsx` — Adding fields (remember to update `/api/contact` too)
- `public/` — Adding static assets
- `next.config.ts` — Adding image hostnames

---

## Areas Requiring Caution

### `src/lib/content.ts` — Content schema
Changing the TypeScript type means any existing JSON data must also be migrated. Removing a field that's displayed somewhere will cause a runtime error if the field doesn't exist in the JSON.

### `src/app/api/auth/route.ts` — Authentication
The `admin_session` cookie is the only gate to admin functionality. Breaking the login/logout flow locks out the admin.

### `/home/sherif/data/ahmed-elakad/content.json` — Live data
This is the live production database. Don't edit it directly without a backup:
```bash
cp /home/sherif/data/ahmed-elakad/content.json /home/sherif/data/ahmed-elakad/content.json.bak
```

### `/home/sherif/data/ahmed-elakad/images/` — Live images
The production image store. ~655 MB. Deleting files here permanently removes images from the site (no recovery).

### `src/app/admin/dashboard/page.tsx` — CMS (143KB)
This file is very large. Make minimal, targeted edits. Avoid large-scale refactors.

### `src/lib/cloudinary.ts` — Legacy SDK
Only used for listing and deleting pre-June-2026 images. Do not change to route new uploads through Cloudinary.

### PM2 process management
The site runs as PM2 process `ahmed-elakad`. After `npm run build`, always run `pm2 restart ahmed-elakad`. Never `pm2 delete` without immediately restarting.
