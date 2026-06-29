# Backend Patterns — Ahmed Elakad Couture House

## API Route Structure

Every API route is a `route.ts` file inside `src/app/api/`. Each file exports named handler functions (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`). All routes set `export const dynamic = "force-dynamic"` to prevent Next.js from caching responses.

The standard anatomy of an authenticated API route:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... handler logic
}
```

---

## Auth Middleware Pattern

There is no centralized middleware file. Every protected handler calls `auth()` inline at the top of the handler body. This is a deliberate design — it makes authorization explicit and avoids subtle route-matching bugs that can occur in `middleware.ts`.

The auth function is duplicated across routes with slightly different names (`auth`, `checkAuth`) but always the same logic:
```typescript
const cookieStore = await cookies();
return cookieStore.get("admin_session")?.value === "authenticated";
```

**Routes that require auth (admin_session cookie):**
- `POST /api/auth` — no, it's the login endpoint itself
- `GET /api/auth` — yes, to check session status
- `DELETE /api/auth` — no auth check needed (logout always succeeds)
- `POST /api/content` — yes
- `POST /api/upload` — yes
- `DELETE /api/upload` — yes
- `POST /api/grab-url` — yes
- `POST /api/ig-video` — yes
- `GET /api/admin/messages` — yes
- `DELETE /api/admin/messages` — yes
- `PATCH /api/admin/messages` — yes
- `POST /api/admin/reorder` — yes
- `POST /api/admin/reorder-images` — yes
- `POST /api/admin/cover` — yes
- `PUT /api/admin/config` — yes

**Routes with NO auth check:**
- `GET /api/content` — public; the content is public site data
- `GET /api/images` — public; used by admin dashboard but open to all
- `POST /api/contact` — public; contact form submission
- `GET /api/admin/clients` — no auth; atelier page reads clients without auth
- `POST /api/admin/clients` — no auth; clients can be created from atelier
- `PUT /api/admin/clients` — no auth; atelier updates clients
- `DELETE /api/admin/clients` — no auth
- `POST /api/upload/voice` — no auth; atelier staff record voice notes

---

## Atomic Write Pattern

**File:** `src/lib/atomicWrite.ts`

```typescript
export function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}
```

The `.tmp` filename is constructed by prepending a dot to the target basename. For `content.json`, the temp file is `.content.json.tmp` in the same directory. Both source and destination must be on the same filesystem for `rename` to be atomic — which is guaranteed here since they share the same parent directory.

All three write libraries call `atomicWriteJSON`:
- `src/lib/content.ts` → `saveContent()`
- `src/lib/clients.ts` → `writeLocal()`
- `src/lib/messages.ts` → `writeLocal()`
- `src/lib/config.ts` → `writeConfig()`

---

## How content.json Is Read

`src/lib/content.ts` — `getContent()`:

```typescript
const CONTENT_FILE = "/home/sherif/data/ahmed-elakad/content.json";

export async function getContent(): Promise<SiteContent> {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8"));
      if (parsed && Object.keys(parsed).length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading content.json:", e);
  }
  return {};
}
```

Key behaviors:
- Returns an empty object `{}` as fallback — never throws to the caller
- `fs.existsSync` check prevents crashing on first-run or missing file
- Non-empty check (`Object.keys(parsed).length > 0`) guards against empty-file edge case
- Because all `SiteContent` fields are optional (`?`), an empty object is a valid `SiteContent`

Every page component handles the missing-data case via `?? ""` or `?? []` fallbacks.

---

## How clients.json Is Updated (Action Dispatch Pattern)

`src/app/api/admin/clients/route.ts` — `PUT` handler:

```typescript
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, action, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (action === "addPayment") {
    const updated = await addPayment(id, { amount, date, note });
    ...
  }
  if (action === "updatePayment") { ... }
  if (action === "deletePayment") { ... }
  if (action === "addDress") { ... }
  if (action === "deleteDress") { ... }
  if (action === "addDressImages") { ... }
  if (action === "removeDressImage") { ... }
  if (action === "updateDressLabel") { ... }
  if (action === "addVoiceNote") { ... }
  if (action === "deleteVoiceNote") { ... }

  // No action = updateClient (base update)
  try {
    const updated = await updateClient(id, { name, email, phone, ... });
    ...
  }
}
```

The action dispatch pattern consolidates 11 sub-operations into one PUT endpoint. The `action` field is a string literal. If `action` is absent, the handler falls through to `updateClient` which does a general field merge.

Every action:
1. Calls the corresponding function in `src/lib/clients.ts`
2. Returns the updated `Client` object on success
3. Returns `{ error: "not found" }` with 404 if the client ID doesn't exist

---

## Image Upload Flow

`src/app/api/upload/route.ts` — `POST` handler:

```
1. auth() check — 401 if not authenticated
2. fs.mkdirSync(IMAGES_DIR, { recursive: true }) — create dir if missing
3. Busboy parses multipart body as a stream (no full-body buffering)
4. For each file:
   a. Determine extension from filename
   b. If VIDEO extension (mp4/webm/mov/avi/mkv/m4v/3gp/hevc/heic/wmv/flv):
      - Save original extension first
      - If not already mp4/webm: call toMp4() to convert via FFmpeg
      - toMp4() uses: libx264, preset fast, crf 23, aac 128k, +faststart, 5min timeout
      - Delete original file after conversion
   c. If IMAGE extension: save as-is
   d. Return URL as "https://ahmedelakad.com/media/{timestamp}-{random}.{ext}"
5. Wait for all file tasks (Promise.all)
6. Return { ok: true, uploaded: string[] }
```

Filename format: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.{ext}`

Example: `1719612345678-abc3x.jpg`

The timestamp prefix enables the sort-by-newest-first logic in `GET /api/images`:
```typescript
.sort((a, b) => {
  const ta = parseInt(a.split("-")[0]) || 0;
  const tb = parseInt(b.split("-")[0]) || 0;
  return tb - ta; // descending
})
```

---

## FFmpeg Video Conversion

Called from `toMp4()` inside `upload/route.ts`:

```typescript
async function toMp4(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, ".mp4");
  await execFileAsync(FFMPEG, [
    "-i", inputPath,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    "-y", outputPath,
  ], { timeout: 300000 }); // 5 minutes
  fs.unlinkSync(inputPath);
  return outputPath;
}
```

This **blocks the upload API handler** for up to 5 minutes during conversion. The upload endpoint uses a `Promise<NextResponse>` wrapper to keep the handler open while conversion runs. This is acceptable because:
- Admin is the only user of this endpoint
- Video uploads are infrequent
- The alternative (background job) would require a job queue infrastructure

---

## Voice Note Handling

Two separate concerns:

**Recording (browser side, in `atelier/page.tsx`):**
1. `navigator.mediaDevices.getUserMedia({ audio: true })` to get mic stream
2. `MediaRecorder` with preferred MIME type (`audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` → `audio/ogg`)
3. Chunks collected via `ondataavailable`, assembled into a `Blob` on `onstop`
4. Sent to `POST /api/upload/voice` as `FormData`

**Storage (`src/app/api/upload/voice/route.ts`):**
- Accepts: webm, mp4, ogg, mp3, wav, aac (max 10 MB)
- Saves to `/home/sherif/data/ahmed-elakad/voices/{timestamp}-{random}.{ext}`
- Returns `{ url: "https://ahmedelakad.com/voices/{filename}" }`
- No auth check — open to atelier staff

**Association:** After upload, the URL is linked to a client via `PUT /api/admin/clients` with `{ action: "addVoiceNote", url, from: "atelier" }`.

**Deletion:** `deleteVoiceNote()` in `src/lib/clients.ts` both removes the record from `clients.json` and deletes the physical file if the URL starts with `https://ahmedelakad.com/voices/`.

---

## Instagram Video Scraping (`/api/ig-video`)

`src/app/api/ig-video/route.ts` uses yt-dlp (a command-line tool, not an npm package):

```typescript
const YTDLP = '/home/sherif/yt-dlp';
const COOKIES_FILE = '/home/sherif/data/ahmed-elakad/ig-cookies.txt';
const PLAYWRIGHT_PROFILE = '/home/sherif/.cache/ms-playwright/mcp-chrome-d26cd27/Default';

// Cookie source priority: explicit cookies file > Playwright browser profile
const cookieArgs: string[] = fs.existsSync(COOKIES_FILE)
  ? ['--cookies', COOKIES_FILE]
  : fs.existsSync(PLAYWRIGHT_PROFILE)
    ? ['--cookies-from-browser', `chromium:${PLAYWRIGHT_PROFILE}`]
    : [];
```

- Validates URL matches `instagram.com/p|reel|tv` pattern
- 90-second timeout
- Output goes to `/home/sherif/data/ahmed-elakad/images/ig-{timestamp}.mp4`
- Returns `{ url: "https://ahmedelakad.com/media/ig-{timestamp}.mp4" }`

This route requires an active Instagram session. If neither cookie source exists, returns 503.

---

## In-Memory Cache in `/api/images`

`src/app/api/images/route.ts` maintains a module-level cache:

```typescript
let cachedResult: { images: string[]; thumbnails: Record<string, string> } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bust = url.searchParams.get("nocache");
  if (bust) { cachedResult = null; cacheTimestamp = 0; }

  const now = Date.now();
  if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedResult, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // ... expensive: read local dir + Cloudinary API call ...

  cachedResult = payload;
  cacheTimestamp = now;
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
```

**TTL:** 30 seconds. After the TTL expires, the next request triggers a fresh filesystem scan and Cloudinary API call.

**Cache bust:** Pass `?nocache=1` to force immediate refresh. The admin dashboard does this after uploading a new image.

**Process-level:** This cache lives in the Node.js module memory. It is shared across requests within a single PM2 process instance but resets on server restart.

**The `excludedUrls` Set:** Also module-level. When a file is deleted via `DELETE /api/upload`, its URL is added to `excludedUrls`. The `GET /api/images` response filters out any URL in this set. This prevents deleted images from reappearing in the 30-second cache window.

---

## URL Grab Route (`/api/grab-url`)

`src/app/api/grab-url/route.ts` fetches remote images into local storage:

1. If the URL is already a local media URL or known Cloudinary URL → return as-is
2. Fetch the remote URL with a mobile Safari user-agent
3. If response is `image/*` → download directly, detect extension from Content-Type
4. If response is `text/html` → extract `og:image` meta tag, then fetch that image
5. Save to `/home/sherif/data/ahmed-elakad/images/` with timestamp filename
6. Return `{ cloudinaryUrl: "https://ahmedelakad.com/media/{filename}" }`

The response field is named `cloudinaryUrl` for legacy reasons (originally this route uploaded to Cloudinary). The value is now always a local media URL.
