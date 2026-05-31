# Ahmed Elakad Couture — AI Agent Guide

## Architecture Overview

This is a **Next.js 16 App Router** application deployed on a VPS. Unlike typical Next.js apps, it uses **JSON files on disk as a database** rather than a SQL database. This is the single most important architectural fact to understand.

```
Browser → Nginx (port 80/443) → Next.js server (port 3000) → JSON files on disk
                                                             → Cloudinary API (images)
```

**Key constraint:** The app MUST run as a persistent Node.js server (via PM2), not Vercel serverless, because serverless functions cannot persist file writes between invocations.

---

## Important Files

| Priority | File | What it does |
|----------|------|-------------|
| Critical | `src/lib/content.ts` | Read/write all site content |
| Critical | `src/lib/clients.ts` | Client CRM logic |
| Critical | `src/lib/messages.ts` | Contact form submissions |
| Critical | `src/lib/config.ts` | Admin password management |
| Critical | `src/lib/cloudinary.ts` | Cloudinary SDK init |
| High | `src/app/admin/dashboard/page.tsx` | CMS UI (143KB, monolithic) |
| High | `src/app/atelier/page.tsx` | Client management UI (RTL Arabic) |
| High | `src/app/api/*/route.ts` | All backend endpoints |
| Medium | `src/components/MasonryGallery.tsx` | Gallery with lightbox |
| Medium | `src/components/CollectionGrid.tsx` | Collection cards + modal |
| Medium | `src/app/layout.tsx` | Root layout (navbar + footer) |
| Config | `next.config.ts` | Image domains |
| Config | `.env.local` | Secrets (never commit) |

**Data files (not in repo, on VPS):**
- `/home/sherif/data/ahmed-elakad/content.json` — All site text and image URLs
- `/home/sherif/data/ahmed-elakad/clients.json` — CRM records
- `/home/sherif/data/ahmed-elakad/messages.json` — Contact form submissions
- `/home/sherif/data/ahmed-elakad/config.json` — Admin password

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
→ `src/app/api/auth/route.ts` — login handler  
→ `src/app/api/admin/config/route.ts` — password change handler

### Add a new API endpoint
Create `src/app/api/[name]/route.ts` with exported functions:
```typescript
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

---

## Common Pitfalls

### 1. Trying to write data on Vercel
The JSON data files are at `/home/sherif/data/ahmed-elakad/` — this path only exists on the VPS. Vercel serverless functions will throw ENOENT errors on any write operation. Always test data writes on the VPS, not via `vercel dev`.

### 2. Cloudinary public_id format
When deleting images, you need the `public_id` (e.g., `Ahmed Elakad/filename`), not the full URL. The `DELETE /api/upload` endpoint accepts `public_id` in the request body.

### 3. Content JSON structure changes
If you add a new top-level key to `content.json`, you must also update the TypeScript type in `src/lib/content.ts`. The type mismatch won't cause a runtime crash but will cause TypeScript build errors.

### 4. Admin authentication check
API routes that require admin check for:
```typescript
const session = cookies().get("admin_session")?.value;
if (session !== "authenticated") {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```
Do NOT change this to a different pattern without updating ALL protected routes.

### 5. Large dashboard file
`src/app/admin/dashboard/page.tsx` is 143KB. Make targeted edits — do not restructure the entire component. Edit only the specific section/function you need to change.

### 6. Images from Cloudinary require remote patterns
If you use a new image hostname, add it to `next.config.ts`:
```typescript
remotePatterns: [{ protocol: "https", hostname: "**.cloudinary.com" }]
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
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Pattern: Content update (PUT flow)
```typescript
// Admin edits → POST /api/content with full content object
// Route handler:
const current = await getContent();
const updated = { ...current, ...partial };
fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
```
Always merge with existing content to avoid overwriting unrelated sections.

### Pattern: Cloudinary image URL stored in JSON
Images are stored as full Cloudinary URLs in JSON files (not public_ids). When displaying with `next/image`, the URL is used directly. When deleting, extract the public_id from the URL.

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
This is the live production database. Don't edit it directly with code tools unless you're sure of the schema. Always make a backup first:
```bash
cp /home/sherif/data/ahmed-elakad/content.json /home/sherif/data/ahmed-elakad/content.json.bak
```

### `src/app/admin/dashboard/page.tsx` — CMS (143KB)
This file is very large. Make minimal, targeted edits. Reading the whole file to understand it is fine, but avoid large-scale refactors.

### `src/lib/cloudinary.ts` — Image SDK
All Cloudinary operations flow through this. Changing the initialization breaks image upload/delete site-wide.

### PM2 process management
The site runs as a PM2 process. After `npm run build`, you must run `pm2 reload ahmed-elakad` (or equivalent) to apply changes. Never `pm2 delete` the process without restarting it.
