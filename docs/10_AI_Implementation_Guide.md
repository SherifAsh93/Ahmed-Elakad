# AI Implementation Guide — Ahmed Elakad Couture House

This document tells an AI engineer exactly how to continue work on this project correctly. Read this before writing a single line of code.

---

## Architecture Rules (Non-Negotiable)

### 1. Always use `force-dynamic`
Every API route and every page that reads from content.json MUST have:
```typescript
export const dynamic = "force-dynamic";
```
Without this, Next.js caches the rendered output and content changes made in the admin are not visible until the cache expires. Do not use `revalidate`, `cache: "force-cache"`, or any ISR pattern.

### 2. Always use `atomicWriteJSON` for all writes
Never use `fs.writeFileSync(path, data)` directly for the JSON data files. Always route through:
```typescript
import { atomicWriteJSON } from "@/lib/atomicWrite";
atomicWriteJSON(filePath, data);
```
Direct writes risk corrupting the file if the process crashes mid-write.

### 3. Never add a database
All data lives in flat-file JSON at `/home/sherif/data/ahmed-elakad/`. Do not add PostgreSQL, SQLite, Redis, or any other database. If a new data type is needed, add a new `.json` file following the pattern in `src/lib/clients.ts` or `src/lib/messages.ts`.

### 4. All new JSON files follow the same pattern
```typescript
const FILE_PATH = "/home/sherif/data/ahmed-elakad/new-data.json";

function readAll(): MyType[] {
  try {
    if (fs.existsSync(FILE_PATH)) {
      return JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

function writeAll(data: MyType[]): void {
  atomicWriteJSON(FILE_PATH, data);
}
```

---

## What to Check Before Adding Features

### Before adding a new API route:
1. Does the endpoint need auth? Check `06_Backend_Patterns.md` — the atelier endpoints intentionally have NO auth. Add auth if it's admin-only.
2. Does it mutate data? Use `atomicWriteJSON`.
3. Does it serve public site data? Add `export const dynamic = "force-dynamic"`.
4. Check `src/app/api/` to see if a similar route already exists.

### Before adding a new CMS field:
1. Add the field to `SiteContent` in `src/lib/content.ts` as an **optional** (`?`) property.
2. Add a `?? fallback` in every page that uses it.
3. Add the editor input to `src/app/admin/dashboard/page.tsx`.
4. No migration needed — the field simply doesn't exist in existing JSON and the fallback handles it.

### Before adding a new client field:
1. Add to the `Client` interface in `src/lib/clients.ts`.
2. Add `?? ""` or `?? []` fallback in `readAll()` when mapping existing records (follow the existing pattern there).
3. Handle the field in `updateClient()` by adding it to the merge.
4. Handle it in the `PUT /api/admin/clients` handler under the general update case.
5. Add it to the form in `src/app/atelier/page.tsx` and/or `src/app/admin/dashboard/page.tsx`.

### Before adding a new page:
1. It's a server component by default. Use `getContent()` to read CMS data.
2. Add `export const dynamic = "force-dynamic"`.
3. Add the route to the `navLinks` array in `src/components/Navbar.tsx`.
4. Add meta tags via `generateMetadata()` following the pattern in other page files.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 CSS Specificity
This project uses Tailwind **v4**, not v3. Custom CSS classes defined in `globals.css` **outside** of `@layer` blocks have higher specificity than Tailwind utility classes. This is intentional (`.nav-link`, `.masonry-grid`, `.pill-btn` etc. must win over utilities).

If you add Tailwind utility classes to an element that also has a `.custom-class`, and the utility doesn't take effect, it's because the custom class has higher specificity. Solution: either move the style into the custom class, or add `!` prefix (`!text-red-500`) to force the utility.

Do NOT use `@apply` — Tailwind v4 handles this differently than v3 and it can cause unexpected behavior.

### Pitfall 2: Image URL Format for `optimizeImage()`
`optimizeImage()` in `src/lib/utils.ts` only routes through `/_next/image` for two URL patterns:
```
https://ahmedelakad.com/media/...   → optimized
https://res.cloudinary.com/...      → optimized
```

It does NOT optimize:
- `/media/filename.jpg` (relative path — convert to absolute first, or it falls through)
- `https://otherdomain.com/image.jpg` (not in remotePatterns)
- Any `.png` file (to preserve transparency)

Always store and pass full absolute URLs (`https://ahmedelakad.com/media/...`), not relative paths.

### Pitfall 3: Phone as Client Primary Key
The `Client.id` is the phone number with all non-digits stripped:
```typescript
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
```

If you create a client lookup, use `normalizePhone(phone)` for comparison. Never use the raw `phone` string as a key. If a client updates their phone number, their `id` changes — this is handled in `updateClient()` but must be handled in any feature you add that references client IDs.

### Pitfall 4: The Atelier Has No Auth
`/atelier` is a public page with no authentication. Do not add any admin-only actions to the atelier without adding explicit auth to the underlying API routes. The current design is intentional: atelier staff are not expected to log in, they just know the URL.

If you add new actions to the atelier that should be admin-only, create new authenticated API routes or add auth to the relevant `PUT /api/admin/clients` action.

### Pitfall 5: Concurrent Writes Are Not Safe
`atomicWriteJSON` prevents partial writes but does not prevent two simultaneous write operations from overwriting each other. The pattern in all write functions is:
```
read all → modify in memory → write all
```
Two simultaneous writes (e.g., two atelier staff adding payments at the same moment) will result in one change being silently lost. This is an accepted limitation of the flat-file architecture. Do not add features that rely on concurrent write safety.

### Pitfall 6: The `generateStaticParams` Year List Is Hardcoded
In `src/app/bridal/[year]/page.tsx` and `src/app/couture/[year]/page.tsx`:
```typescript
const ALL_YEARS = ["2026","2025","2024","2023","2022"];
```

This array controls which year slugs are valid. If you add content for a new year in `content.json` without adding the year to this array, the page returns `404`. The array must be updated in the source code and the app rebuilt.

### Pitfall 7: FFmpeg Blocks the Upload Handler
`POST /api/upload` holds the HTTP connection open during FFmpeg conversion. For large video files this can take minutes. If you're building features that call the upload endpoint:
- Set a long timeout on the client-side fetch
- Don't assume the response comes back quickly
- The current pattern works for a single admin but would be unacceptable for public-facing uploads

### Pitfall 8: Cloudinary is Legacy / Read-Only
The `cloudinary` npm package is still installed and the `GET /api/images` route still queries Cloudinary for legacy images. However:
- No new uploads go to Cloudinary
- If Cloudinary env vars are missing, the Cloudinary block is silently skipped
- Do not add new Cloudinary upload logic — all new uploads go to local disk

---

## Implementation Checklist for New Features

Before finishing any feature, verify:

- [ ] API route has `export const dynamic = "force-dynamic"` if it reads from JSON files
- [ ] All JSON writes use `atomicWriteJSON`, not `fs.writeFileSync` directly
- [ ] Protected routes call `cookies().get("admin_session")?.value === "authenticated"` at the top of each handler
- [ ] New `SiteContent` fields are optional (`?`) and pages use `?? fallback` values
- [ ] New client fields handle missing/undefined values in `readAll()` (pattern: `c.newField ?? ""`)
- [ ] Image URLs stored in JSON are full absolute URLs (`https://ahmedelakad.com/media/...`)
- [ ] `optimizeImage()` is called on all image URLs before passing to `<img src>` or `<Image>` in server components
- [ ] Admin input fields that reference images use the image picker (not raw text input)
- [ ] New public pages have `export const dynamic = "force-dynamic"`
- [ ] New pages are added to `navLinks` in `Navbar.tsx` if they should appear in navigation

---

## Code Patterns to Replicate

### Action Dispatch (for complex resource operations)
When a resource needs many sub-operations (add/remove nested items, etc.), use the action dispatch pattern from `PUT /api/admin/clients`:
```typescript
const { id, action, ...data } = body;
if (action === "addItem") { ... }
if (action === "removeItem") { ... }
// no action → general update
```

### In-Memory Cache
When an endpoint is expensive to compute (filesystem scan, external API), cache the result at module level:
```typescript
let cache: ResponseType | null = null;
let cacheTime = 0;
const TTL = 30_000;

export async function GET(req: Request) {
  const bust = new URL(req.url).searchParams.get("nocache");
  if (bust) { cache = null; cacheTime = 0; }
  if (cache && Date.now() - cacheTime < TTL) return NextResponse.json(cache);
  // ... expensive work ...
  cache = result;
  cacheTime = Date.now();
  return NextResponse.json(cache);
}
```

### Canvas Compression Before Upload
For any feature where users upload images from the client side, use `compressImage()` from `src/lib/compressImage.ts` before sending to the server:
```typescript
import { compressImage } from "@/lib/compressImage";

const compressed = await compressImage(file); // max 1600px, 0.82 JPEG quality
const fd = new FormData();
fd.append("files", compressed, compressed.name);
await fetch("/api/upload", { method: "POST", body: fd });
```

### Auth-Gated Content Sections
For sections that should only render if the user is authenticated, check via `GET /api/auth` on mount:
```typescript
useEffect(() => {
  fetch("/api/auth").then(r => {
    if (!r.ok) router.push("/admin");
  });
}, []);
```

---

## Things That Will Break If Done Wrong

**If you use `fs.writeFileSync` directly instead of `atomicWriteJSON`:**
A crash mid-write produces a truncated JSON file. The app silently returns `{}` as content or `[]` as clients list. All CMS content and all client records will appear gone. The file must be restored from backup.

**If you remove `export const dynamic = "force-dynamic"` from a page:**
Next.js caches the rendered page. Admin content changes will not appear to visitors until the cache expires or the server restarts. The homepage banner, hero text, and all collection images will appear frozen at the time of the last build.

**If you store a relative `/media/filename.jpg` URL in content.json instead of the full `https://ahmedelakad.com/media/filename.jpg`:**
`optimizeImage()` does not recognize relative paths as local media URLs. The image will not be routed through `/_next/image`. If the path also doesn't match Cloudinary, it's served as-is from the original relative path — which works only from the same origin but breaks in any fetch context.

**If you add a year to `content.json` without adding it to `ALL_YEARS` in the page files:**
The year tab appears nowhere (since the tabs are generated from `ALL_YEARS`). The route `/bridal/2027` returns 404. The collections exist in JSON but are inaccessible.

**If you add a new non-optional (`!`) field to the `Client` interface without updating `readAll()`:**
TypeScript will not warn you — the `readAll()` map operation will produce clients where the field is `undefined` at runtime. The atelier or admin dashboard will crash on access. Always add fields as optional or add a `?? default` in the `readAll()` map.

**If you add a new public-facing page without `export const dynamic = "force-dynamic"`:**
The page will render once and be cached indefinitely. Since content comes from `getContent()` which reads the live JSON file, the page content will be frozen at build time. Visitors will see stale content that no admin action can update without a full rebuild.

**If you add auth to `GET /api/admin/clients` without updating the atelier page:**
The atelier (`/atelier`) will stop loading clients because it calls `GET /api/admin/clients` without sending any admin cookie. Every client record will disappear from the atelier UI.
