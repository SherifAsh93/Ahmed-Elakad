# Tech Stack — Ahmed Elakad Couture House

## Dependencies (`package.json`)

### Production Dependencies

#### `next` — 16.2.3
The core framework. Version 16 is the current stable release of Next.js (App Router only — no Pages Router).

Key Next.js 16 features used:
- **App Router** — all routes live under `src/app/`
- **Server Components** — all page components are server components by default; client components opt in with `"use client"`
- **`generateStaticParams`** — used in `bridal/[year]/page.tsx` and `couture/[year]/page.tsx` to pre-declare valid year slugs (`["all","2026","2025","2024","2023","2022"]`)
- **`export const dynamic = "force-dynamic"`** — disables all caching on API routes and pages; every request re-renders from disk
- **`revalidatePath`** — called after content writes to purge RSC cache entries
- **Next.js Image Optimizer** — the `/_next/image` endpoint handles resize, format conversion (AVIF/WebP), and 30-day disk caching

Alternatives NOT chosen:
- Remix — would have required rethinking the data layer patterns
- Vite/SvelteKit — project started as Next.js; migration cost not justified
- Pages Router — App Router provides superior Server Components integration

#### `react` — 19.2.4 / `react-dom` — 19.2.4
React 19 (released March 2025). Required by Next.js 16.

Notable React 19 behaviors used:
- `"use client"` boundary marker now stable
- Server Actions (NOT used in this project — all mutations go through explicit API routes)

#### `busboy` — ^1.6.0
Streams-based multipart form parser used in `POST /api/upload`. The Next.js App Router does not ship a built-in multipart parser for streaming bodies. Busboy is used instead of `formidable` or `multiparty` because:
- It processes the stream without buffering the entire body into memory
- Allows concurrent file writes as each `file` event fires

The upload handler manually pipes the `req.body` ReadableStream into Busboy:
```typescript
const reader = req.body?.getReader();
const pump = async () => {
  while (true) {
    const { done, value } = await reader.read();
    if (done) { bb.end(); break; }
    if (!bb.write(value)) await new Promise(r => bb.once("drain", r));
  }
};
```

Alternatives NOT chosen:
- `formidable` — would have worked but busboy is lower-level and already used in the Next.js ecosystem
- Native `req.formData()` — does not support streaming to disk; buffers entire upload in memory, which is unsafe for large video files

#### `cloudinary` — ^2.9.0
Cloudinary Node.js SDK v2. Used for:
- Listing legacy images via `cloudinary.search.execute()` in `GET /api/images`
- Deleting legacy Cloudinary images via `cloudinary.uploader.destroy(publicId)` in `DELETE /api/upload`
- Generating signed thumbnail URLs via `cloudinary.url(publicId, { width, height, crop, ... })`

No new uploads go to Cloudinary. The SDK is a runtime dependency only because the legacy Cloudinary library is still being served. If all Cloudinary images were migrated to local storage, this dependency could be removed.

---

### Dev Dependencies

#### `tailwindcss` — ^4 / `@tailwindcss/postcss` — ^4
Tailwind CSS v4. This is a breaking change from v3 — **do not apply v3 patterns here**.

Key v4 differences:
- **No `tailwind.config.js`** — configuration is done via CSS variables in `globals.css` and the PostCSS plugin
- **Import via `@import "tailwindcss"`** in `globals.css` — not `@tailwind base; @tailwind components; @tailwind utilities;`
- **`postcss.config.mjs`** uses `@tailwindcss/postcss` plugin, not the v3 `tailwindcss` plugin
- **CSS specificity**: Tailwind v4 uses `@layer` with different cascade behavior. Custom classes defined outside `@layer` have higher specificity than utility classes. This is intentional in this codebase — all `.nav-link`, `.masonry-grid`, `.pill-btn` etc. are defined in `globals.css` at top level (not in `@layer components`) so they take precedence over utilities.

#### `typescript` — ^5
TypeScript 5 in strict mode. `tsconfig.json` enables:
- `strict: true` — enables all strict checks
- `noEmit: true` — TypeScript is type-checking only; Babel/SWC handles compilation
- `moduleResolution: "bundler"` — aligned with Next.js bundler (not Node.js resolution)

#### `eslint` — ^9 / `eslint-config-next` — 16.2.3
ESLint 9 with Next.js config. Linting is manual (`npm run lint`); no pre-commit hook is configured.

---

## `next.config.ts` — Full Settings

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "ahmedelakad.com", pathname: "/media/**" },
    ],
    formats: ["image/avif", "image/webp"],  // Try AVIF first, fall back to WebP
    minimumCacheTTL: 2592000,               // 30 days — optimized images cached on disk
    deviceSizes: [640, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 64, 128, 256, 384, 500],
    qualities: [75, 85],                    // 75 for standard, 85 for hero/banners
    unoptimized: false,
  },
  experimental: {},
};
```

`remotePatterns` allows the image optimizer to fetch from:
1. Any Cloudinary hostname (e.g., `res.cloudinary.com`)
2. `ahmedelakad.com/media/**` — the local Nginx-served media directory

`formats: ["image/avif", "image/webp"]` — Next.js will serve AVIF to browsers that support it (Chrome, Firefox), WebP to others, and fall back to the original format for Safari if needed.

`minimumCacheTTL: 2592000` — each optimized image variant is cached on the server's `.next/cache/images/` directory for 30 days before being re-fetched. This is important for a VPS with no CDN — the optimization work is not repeated on every request.

---

## `tsconfig.json` — Key Settings

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`paths: { "@/*": ["./src/*"] }` — allows all imports to use `@/lib/content` instead of `../../lib/content`. This is the only path alias in the project.

---

## `postcss.config.mjs`

```javascript
const config = {
  plugins: { "@tailwindcss/postcss": {} }
};
export default config;
```

Tailwind v4 processes CSS through PostCSS. The plugin reads `globals.css` and generates the final stylesheet. No explicit `content` or `safelist` configuration is needed — Tailwind v4 scans all TypeScript and TSX files automatically.

---

## External Tools on VPS

These are not npm dependencies but are required at runtime:

| Tool | Path | Purpose |
|---|---|---|
| FFmpeg | `/usr/bin/ffmpeg` | Video conversion to mp4 in `POST /api/upload` |
| yt-dlp | `/home/sherif/yt-dlp` | Instagram video download in `POST /api/ig-video` |

FFmpeg invocation (from `upload/route.ts`):
```typescript
await execFileAsync(FFMPEG, [
  "-i", inputPath,
  "-c:v", "libx264", "-preset", "fast", "-crf", "23",
  "-c:a", "aac", "-b:a", "128k",
  "-movflags", "+faststart",
  "-y", outputPath,
], { timeout: 300000 }); // 5-minute timeout
```

yt-dlp invocation (from `ig-video/route.ts`):
```typescript
await execFileAsync(YTDLP, [
  '--no-warnings',
  ...cookieArgs,                      // either --cookies file or --cookies-from-browser profile
  '--merge-output-format', 'mp4',
  '-o', outTemplate,
  url.trim(),
], { timeout: 90000 }); // 90-second timeout
```

yt-dlp requires either an Instagram cookies file at `/home/sherif/data/ahmed-elakad/ig-cookies.txt` or a Playwright browser profile at `/home/sherif/.cache/ms-playwright/mcp-chrome-d26cd27/Default`.
