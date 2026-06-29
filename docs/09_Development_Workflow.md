# Development Workflow — Ahmed Elakad Couture House

## Local Development Setup

### Prerequisites
- Node.js 24+
- npm
- FFmpeg (for video upload testing): `apt install ffmpeg`

### 1. Install Dependencies
```bash
cd /home/sherif/sites/Ahmed-Elakad
npm install
```

### 2. Data Directory Setup

The app reads from `/home/sherif/data/ahmed-elakad/` in production. For local development, you can either:

**Option A: Use the same path (symlink or same machine)**
```bash
mkdir -p /home/sherif/data/ahmed-elakad/images
mkdir -p /home/sherif/data/ahmed-elakad/voices
cp src/data/content.json /home/sherif/data/ahmed-elakad/
cp src/data/clients.json /home/sherif/data/ahmed-elakad/
cp src/data/messages.json /home/sherif/data/ahmed-elakad/
cp src/data/config.json /home/sherif/data/ahmed-elakad/
```

**Option B: The app falls back gracefully**
If the production path doesn't exist, `getContent()` returns `{}` and all page sections render with empty/default values. The CRM will show 0 clients. Upload will fail (directory doesn't exist) unless created.

### 3. Environment Variables

Create a `.env.local` file:

```env
# Cloudinary (optional — only needed to access legacy image library)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=Ahmed Elakad

# Admin password fallback (only used if config.json is missing)
ADMIN_PASSWORD=114891

# NODE_ENV (set automatically by Next.js dev mode)
NODE_ENV=development
```

Without Cloudinary env vars: `GET /api/images` returns only local images (Cloudinary block is skipped). Upload/delete still works for local files.

### 4. Start Dev Server
```bash
npm run dev
```

Access at `http://localhost:3000`.

Admin access: Navigate to `http://localhost:3000` and triple-tap the brand name in the top-left within 600ms. Enter the password from `config.json` (default: `114891`).

---

## VPS Deployment (Production)

### PM2 Process

The Next.js app runs under PM2. Commands:

```bash
# Start (after build)
pm2 start npm --name "ahmed-elakad" -- start

# Restart after code change
pm2 restart ahmed-elakad

# View logs
pm2 logs ahmed-elakad

# Build + restart (full deploy)
cd /home/sherif/sites/Ahmed-Elakad && npm run build && pm2 restart ahmed-elakad
```

### Nginx Configuration Notes

Nginx acts as a reverse proxy and static file server:

```nginx
# Reverse proxy: all traffic → Next.js on port 3000
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Static media: served directly from disk (bypass Next.js)
location /media/ {
    alias /home/sherif/data/ahmed-elakad/images/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location /voices/ {
    alias /home/sherif/data/ahmed-elakad/voices/;
}
```

The `/media/` location being served directly by Nginx (not proxied through Next.js) is why the image optimizer needs the full `https://ahmedelakad.com/media/{file}` URL — it fetches the image from Nginx during optimization.

---

## How to Add a New Collection Year

The supported years are hardcoded in two places. To add a year (e.g., 2027):

**Step 1: Update `bridal/[year]/page.tsx`**
```typescript
// Line 7
const ALL_YEARS = ["2027","2026","2025","2024","2023","2022"]; // add 2027
```

**Step 2: Update `couture/[year]/page.tsx`**
Same constant, same change.

**Step 3: Update `content.json`**
The admin dashboard or direct file edit — add an empty year entry:
```json
"bridal": {
  "years": {
    "2027": { "collections": [] },
    "2026": { "collections": [...] }
  }
}
```

The `generateStaticParams` function returns `["all","2027","2026","2025","2024","2023","2022"]` as valid slugs. Requests for undefined years trigger `notFound()`:
```typescript
if (year !== "all" && !ALL_YEARS.includes(year)) notFound();
```

**Step 4: Rebuild and restart**
```bash
npm run build && pm2 restart ahmed-elakad
```

Because these pages use `force-dynamic`, adding a year only needs a server restart — not a rebuild — if the year was already in `generateStaticParams`. If you added it to `generateStaticParams`, a rebuild is needed to include the new static param.

---

## How to Add a New Content Section

When adding a completely new page section that needs CMS support:

**Step 1: Extend `SiteContent` in `src/lib/content.ts`**
```typescript
export interface SiteContent {
  // ... existing ...
  newSection?: {
    heading?: string;
    images?: string[];
  };
}
```

All fields should be optional (`?`).

**Step 2: Add default rendering in the page component**
```typescript
const heading = content.newSection?.heading ?? "Default Heading";
const images = content.newSection?.images ?? [];
```

**Step 3: Add editor UI in `src/app/admin/dashboard/page.tsx`**
The dashboard is a single large client component. Add a new tab and form fields for the new section. When saving, POST the full updated `SiteContent` to `POST /api/content`.

**Step 4: No migration needed**
Since all fields are optional, existing `content.json` files without the new keys work automatically — the page just uses the `?? fallback` values.

---

## Environment Variables List

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud for legacy image listing |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API access |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API signing |
| `CLOUDINARY_FOLDER` | No | `"Ahmed Elakad"` | Cloudinary folder to search |
| `ADMIN_PASSWORD` | No | `"114891"` | Fallback admin password if config.json missing |
| `NODE_ENV` | Auto | `"development"` | Controls `secure` flag on cookies |

No `.env.local` is required for the site to function. Only Cloudinary access and the password fallback are affected.

---

## Troubleshooting

### Images Not Showing After Upload

1. **Check Nginx is serving `/media/`**: `curl -I https://ahmedelakad.com/media/{filename}`
2. **Check the file exists**: `ls /home/sherif/data/ahmed-elakad/images/`
3. **Check Next.js `remotePatterns`** in `next.config.ts`: the hostname `ahmedelakad.com` with path `/media/**` must be listed
4. **Force cache bust**: open the admin image picker with `?nocache=1` appended to a direct `/api/images` call
5. **PNG files**: PNG files are not run through `/_next/image` (to preserve transparency). If a PNG looks wrong, it's served as-is — check the original file

### Content Not Saving

1. **Check auth**: verify `admin_session` cookie is present (`document.cookie` in browser devtools)
2. **Check file permissions**: the Next.js process (PM2) must have write access to `/home/sherif/data/ahmed-elakad/`
3. **Check for leftover `.tmp` file**: if `atomicWriteJSON` crashed mid-rename, a `.content.json.tmp` file may exist. It can be safely deleted or manually renamed
4. **Check PM2 logs**: `pm2 logs ahmed-elakad` for write errors

### Auth Issues (Can't Log In)

1. The password is in `config.json`: `cat /home/sherif/data/ahmed-elakad/config.json`
2. If `config.json` is missing, the fallback is `process.env.ADMIN_PASSWORD ?? "114891"`
3. The cookie is `httpOnly` so JavaScript can't read it — check via Application → Cookies in browser devtools
4. The session lasts 30 days. After 30 days, log in again

### Atelier Not Loading Clients

1. The atelier fetches from `GET /api/admin/clients` — check that endpoint returns data
2. Clients with phone numbers shorter than 7 digits are filtered out (see `readLocal()` in `clients.ts`)
3. If `clients.json` is corrupt (invalid JSON), `readAll()` silently returns `[]` — check the file manually

### Video Upload Timeout

FFmpeg conversion can take up to 5 minutes. The handler holds the connection open during conversion. If the browser times out before FFmpeg finishes:
- The file was still likely saved (check `/home/sherif/data/ahmed-elakad/images/`)
- The browser may show an error but the upload succeeded — refresh the image list

### Instagram Video Download Fails

1. Check that yt-dlp exists: `ls /home/sherif/yt-dlp`
2. Check session: either `/home/sherif/data/ahmed-elakad/ig-cookies.txt` must exist, or the Playwright profile at `/home/sherif/.cache/ms-playwright/mcp-chrome-d26cd27/Default`
3. Instagram regularly changes its auth requirements — yt-dlp may need updating: `wget -O /home/sherif/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp && chmod +x /home/sherif/yt-dlp`
