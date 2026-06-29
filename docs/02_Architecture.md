# Architecture — Ahmed Elakad Couture House

## System Diagram (Text)

```
Browser
  │
  ├─ Public pages (/  /bridal /couture /about /experience /contact)
  │    └─ Next.js Server Components
  │         └─ getContent() ──► fs.readFileSync("/home/sherif/data/ahmed-elakad/content.json")
  │
  ├─ Atelier CRM (/atelier) ── "use client", no auth
  │    └─ fetch("/api/admin/clients") on mount + every 30s
  │
  ├─ Admin CMS (/admin/dashboard) ── "use client", session-gated via fetch
  │    └─ fetch("/api/content") + fetch("/api/images") + fetch("/api/admin/messages")
  │
  └─ API Routes (/api/**)
       ├─ All reads: fs.readFileSync → JSON.parse
       ├─ All writes: JSON.stringify → writeFileSync(.tmp) → renameSync (atomic)
       └─ Auth check: cookies().get("admin_session")?.value === "authenticated"

VPS Filesystem
  ├─ /home/sherif/data/ahmed-elakad/
  │    ├─ content.json      ← all site content
  │    ├─ clients.json      ← client CRM records
  │    ├─ messages.json     ← contact form submissions
  │    ├─ config.json       ← admin password
  │    ├─ images/           ← uploaded media (served via Nginx at /media/)
  │    └─ voices/           ← voice note audio files (served via Nginx at /voices/)
  │
  └─ Next.js app (PM2 process)

Nginx
  ├─ Reverse proxy: 443 → localhost:3000 (Next.js)
  ├─ Static serve: /media/ → /home/sherif/data/ahmed-elakad/images/
  └─ Static serve: /voices/ → /home/sherif/data/ahmed-elakad/voices/

Cloudinary (legacy, read-only)
  └─ GET /api/images fetches Cloudinary library if env vars present
     (no new uploads go to Cloudinary; all new uploads go to local disk)
```

---

## Data Flow: Read Path

```
1. Browser requests /bridal/2025
2. Next.js matches src/app/bridal/[year]/page.tsx (Server Component)
3. page.tsx calls getContent() from src/lib/content.ts
4. getContent() checks fs.existsSync("/home/sherif/data/ahmed-elakad/content.json")
5. If found: JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8"))
6. Page renders with data, sends HTML to browser
7. Because force-dynamic is set: NO cached RSC payload is used, EVERY request re-reads the file
```

Every public page has `export const dynamic = "force-dynamic"` set either explicitly or inherited from API routes. This means content changes made in the admin are visible immediately on next page load — without any cache invalidation ceremony beyond `revalidatePath()` being called as a courtesy after content saves.

---

## Data Flow: Write Path (Content)

```
1. Admin in /admin/dashboard edits content and clicks Save
2. Dashboard (client component) sends POST /api/content with full SiteContent JSON body
3. API route checks cookie: cookies().get("admin_session")?.value === "authenticated"
4. Calls saveContent(body) → atomicWriteJSON(CONTENT_FILE, data)
5. atomicWriteJSON:
   a. Writes JSON to /home/sherif/data/ahmed-elakad/.content.json.tmp
   b. fs.renameSync(.tmp → content.json)  ← POSIX atomic; readers always see complete file
6. revalidatePath("/", "layout") is called to clear Next.js RSC cache
7. API returns { ok: true }
8. Session cookie is refreshed (maxAge reset to 30 days)
```

---

## Data Flow: Write Path (Client Record)

```
1. Atelier staff taps "إضافة دفعة" (Add Payment) in /atelier
2. Client component sends PUT /api/admin/clients with { id, action: "addPayment", amount, date, note }
3. API route dispatches to addPayment(clientId, paymentData) in src/lib/clients.ts
4. clients.ts:
   a. readAll() — readFileSync("/home/sherif/data/ahmed-elakad/clients.json")
   b. Maps over array, finds matching client by id, appends new payment
   c. autoStatus() recalculates status based on total payments vs totalPrice
   d. writeLocal(next) → atomicWriteJSON(CLIENTS_FILE, updatedArray)
5. API returns updated Client object
6. Atelier page calls refresh() which re-fetches the full clients list
```

---

## Admin Dashboard Architecture

`src/app/admin/dashboard/page.tsx` is a **single large "use client" component**. This is intentional:

- All tabs (Homepage, About, Bridal, Couture, Experience, Contact, Clients, Messages) live in one file
- Data is loaded with `fetch()` calls inside `useEffect` on mount — not server-side
- Auth is verified client-side by calling `GET /api/auth` on mount; if 401, redirect to `/admin`
- The dashboard never uses `getContent()` directly — it always reads through the API to ensure it gets the live file state
- This design avoids server/client hydration mismatches and allows all tabs to share a single auth check and loading state

---

## Why force-dynamic (Not ISR)

ISR (Incremental Static Regeneration) requires a consistent external trigger (webhook or time interval) and a CDN layer. This project has neither. Content is managed directly on the VPS filesystem. ISR would:
- Cache a stale version of pages for a time interval
- Require the admin to wait for revalidation after saving content

`force-dynamic` ensures every request re-reads the JSON file, which is fine because:
1. The JSON files are on the same VPS machine — no network round-trip
2. File reads are fast (< 1ms for files this size)
3. Page content updates are immediately visible

---

## Atomic Write Pattern

`src/lib/atomicWrite.ts` — the only function:

```typescript
export function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}
```

Why this matters: If the process crashes mid-write with a direct `writeFileSync`, the target file ends up with partial content and becomes unparseable JSON. The `.tmp` → rename approach means:
- If the crash happens before `renameSync`: the original file is untouched, the `.tmp` file is left as garbage
- If `renameSync` succeeds: the swap is atomic from the perspective of any concurrent reader

**Limitation:** This is atomic per the POSIX filesystem guarantee, but it does not protect against two concurrent writes to the same file. If two API requests write simultaneously, one write will silently overwrite the other. The single-process PM2 deployment makes this unlikely but not impossible.

---

## Dual Storage (Local Disk + Cloudinary)

`/api/images/route.ts` merges two sources:

```
localImages (from /home/sherif/data/ahmed-elakad/images/)
  + cloudinaryImages (from Cloudinary API search, if env vars present)
  = deduped list, local-first
```

- All new uploads (since storage migration) go to local disk only
- Cloudinary images remain accessible (they appear in the image picker) but cannot be uploaded to
- When deleting a Cloudinary image via `DELETE /api/upload`, the route calls `cloudinary.uploader.destroy(publicId)` to remove it from Cloudinary
- `excludedUrls` is a module-level `Set<string>` that accumulates deleted URLs during the process lifetime, filtering them from `GET /api/images` responses without requiring a full-list rebuild

---

## Image Serve Path

```
Upload:
  Browser → compressImage() (canvas, 1600px max, 0.82 JPEG quality)
         → POST /api/upload (multipart/form-data via busboy)
         → fs.writeFileSync(/home/sherif/data/ahmed-elakad/images/{timestamp}-{rand}.{ext})
         → returns "https://ahmedelakad.com/media/{filename}"
         → stored in content.json as that full URL

Display in Server Component:
  image URL from content.json
         → optimizeImage(url) in src/lib/utils.ts
         → "/_next/image?url=https%3A%2F%2Fahmedelakad.com%2Fmedia%2F{file}&w=1200&q=75"
         → Next.js image optimizer fetches from Nginx /media/
         → converts to AVIF or WebP per browser Accept header
         → caches optimized version on disk for 30 days (minimumCacheTTL: 2592000)
         → serves to browser

Display in Atelier / Admin:
  image URL stored in clients.json
         → rendered as raw <img src={url}> without optimizeImage()
         → served directly by Nginx from /media/
```

---

## Why No Database

The entire content of this site fits comfortably in a few JSON files:
- `content.json`: ~50KB (all site text, image URLs, testimonials, videos)
- `clients.json`: grows with client count but remains fast for hundreds of records
- `messages.json`: contact form submissions, negligible size

The operational benefits of a flat-file system for this project:
- Zero infrastructure dependencies (no PostgreSQL, Redis, etc.)
- No connection pooling, migration scripts, or schema evolution
- Backup = `cp content.json content.json.bak`
- All data is human-readable and directly editable

The trade-off: no concurrent write safety, no query capability, no transactions. Acceptable given the single-admin, low-write-frequency nature of this site.
