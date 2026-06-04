# Ahmed Elakad Couture — Database Guide

## Database Provider

**No SQL database.** All data is stored in JSON files on the VPS disk.

- **Location:** `/home/sherif/data/ahmed-elakad/` (external to repo, never committed to git)
- **Format:** Plain JSON files, read/written by Next.js API routes at runtime
- **ORM/Query Layer:** None — raw `fs.readFileSync` / `fs.writeFileSync` via helper modules in `src/lib/`

This design means the site **must run on the VPS** (not Vercel serverless) for data persistence to work. Vercel deployments cannot write to disk.

---

## Full Data Directory Layout

```
/home/sherif/data/ahmed-elakad/
├── config.json          # Admin password (~30 bytes)
├── content.json         # All public site content (~13+ KB, grows as content is added)
├── messages.json        # Contact form submissions (array, grows over time)
├── clients.json         # Client/order CRM records (array, grows over time)
├── images/              # Uploaded images — PRIMARY image storage (VPS local disk)
│   ├── 1780416174964-7dqc8.jpg
│   ├── 1780440404114-fgiy0.jpg
│   └── ...              # ~1,700+ files, ~655 MB as of June 2026
└── voices/              # Voice note recordings for Atelier client CRM
    ├── 1780491009185-muvzq.webm
    └── ...              # Audio files uploaded by admin in Atelier
```

---

## Image Storage — Two Systems Coexist

The site migrated from Cloudinary to VPS local disk on 2026-06-02. Both systems are still active.

### System 1: VPS Local Disk (NEW — active primary)

All images uploaded **after 2026-06-02** are stored on the VPS.

| Property | Value |
|----------|-------|
| Upload endpoint | `POST /api/upload` |
| Storage path | `/home/sherif/data/ahmed-elakad/images/` |
| Public URL | `https://ahmedelakad.com/media/{filename}` |
| Served by | Nginx (`/media/` → alias of images dir), bypasses Next.js |
| Filename format | `{timestamp}-{5randomchars}.{ext}` e.g. `1780416174964-7dqc8.jpg` |
| Supported formats | `.jpg`, `.png`, `.webp`, `.gif` |
| Cache | 1 year (`Cache-Control: public, immutable`) |
| Current size | ~1,700 files, ~655 MB |

How upload works (code: `src/app/api/upload/route.ts`):
1. Admin sends multipart form with file(s) to `POST /api/upload`
2. Server checks admin session cookie
3. File buffer saved to `/home/sherif/data/ahmed-elakad/images/{timestamp}-{rand}.{ext}`
4. Returns `https://ahmedelakad.com/media/{filename}` — this URL is stored in `content.json`

Delete works by unlinking the file from disk directly.

### System 2: Cloudinary (LEGACY — still referenced, no new uploads)

Images uploaded **before 2026-06-02** live on Cloudinary's CDN.

| Property | Value |
|----------|-------|
| Cloud name | `dzppk5ylt` |
| Folder | `Ahmed Elakad` |
| URL pattern | `https://res.cloudinary.com/dzppk5ylt/image/upload/...` |
| SDK | `cloudinary@2.9.0` initialized in `src/lib/cloudinary.ts` |
| Still works? | Yes — Cloudinary URLs don't expire, they still load |
| New uploads? | No — all new uploads go to VPS disk |

The legacy Cloudinary images are still referenced inside `content.json` by their original URLs. They will continue to work as long as the Cloudinary account is active and within its free tier limits (25 GB storage, 25 GB bandwidth/month on free plan).

`GET /api/images` returns a combined list: local VPS images first (newest), then Cloudinary images. The admin media library shows both, allowing the admin to assign any image to any content slot.

### System 3: Voice Notes (VPS Local Disk)

Voice recordings for the Atelier client CRM are stored separately.

| Property | Value |
|----------|-------|
| Upload endpoint | `POST /api/upload/voice` |
| Storage path | `/home/sherif/data/ahmed-elakad/voices/` |
| Public URL | `https://ahmedelakad.com/voices/{filename}` |
| Served by | Nginx (`/voices/` → alias of voices dir), bypasses Next.js |
| Max file size | 10 MB |
| Supported formats | `.webm`, `.mp4`, `.ogg`, `.mp3`, `.wav`, `.aac` |
| Cache | 1 year (`Cache-Control: public, immutable`) |

### How image URLs flow through the system

```
Upload                         Storage                  Nginx serves
------                         -------                  ------------
POST /api/upload           →   /data/.../images/        /media/{file}
POST /api/grab-url         →   /data/.../images/        /media/{file}
[legacy Cloudinary upload] →   Cloudinary CDN           res.cloudinary.com/...

Both URL types stored in content.json as plain strings.
Next.js reads content.json and renders <img> or <Image> with the stored URL directly.
```

### Grab-URL feature

`POST /api/grab-url` lets the admin paste any external URL (Instagram post, direct image URL, etc.) and the server will:
1. Fetch the URL
2. If it's an HTML page, extract `og:image` meta tag
3. Download the image buffer
4. Save to VPS disk exactly like a direct upload
5. Return a local `/media/` URL

This means all externally-sourced images also end up on VPS disk, not on Cloudinary.

---

## JSON Schema Overview

Four JSON files act as the "tables":

| File | Purpose | Managed by |
|------|---------|------------|
| `config.json` | Admin password | `src/lib/config.ts` |
| `content.json` | All public site content | `src/lib/content.ts` |
| `messages.json` | Contact form submissions | `src/lib/messages.ts` |
| `clients.json` | Client/order CRM records | `src/lib/clients.ts` |

---

### `config.json`
```json
{
  "adminPassword": "114891"
}
```
- Read by `src/lib/config.ts → getAdminPassword()`
- Written by `src/app/api/admin/config/route.ts` (PUT) when admin changes password

---

### `content.json`
All public site content. Edited via the admin dashboard.

Top-level keys:
```
siteInfo         — brand name, logo URL
homepage         — hero, collections, real brides grid, CTA section
about            — title, tagline, bio paragraphs, portrait, gallery[4]
bridal           — bannerImage, years: { "2026": { collections: [...] }, ... }
couture          — same structure as bridal
experience       — hero, testimonials[], videos[], CTA section
contact          — pageTitle, phones, email, location, heroImage, internationalBrides
social           — instagram, facebook, whatsapp, threads, tiktok
footer           — copyright, creditText, creditLink
```

Image fields inside `content.json` contain full URLs — either:
- `https://ahmedelakad.com/media/{filename}` (new VPS local)
- `https://res.cloudinary.com/dzppk5ylt/...` (legacy Cloudinary)

Both URL types are valid and work in production.

- Read by `src/lib/content.ts → getContent()`
- Written by `src/app/api/content/route.ts` (POST) when admin saves changes

---

### `messages.json`
Array of contact form submissions.

```json
[
  {
    "id": "reax0igyq",
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "+20 100 000 0000",
    "message": "I would like an appointment",
    "createdAt": "2026-05-17T21:42:15.704Z",
    "read": false
  }
]
```

- Written on new contact form submission: `src/app/api/contact/route.ts`
- Messages can be marked read/unread or deleted via admin dashboard

---

### `clients.json`
Array of client/order records for the Atelier dashboard.

```json
[
  {
    "id": "201280800008",
    "name": "Client Name (Arabic supported)",
    "email": "",
    "phone": "+20 128 080 0008",
    "notes": "Any notes",
    "totalPrice": 15000,
    "payments": [
      {
        "id": "g7acarptr",
        "amount": 5000,
        "date": "2026-05-18",
        "note": "Initial deposit"
      }
    ],
    "dresses": [
      {
        "id": "g7acarptr",
        "label": "Wedding dress 2026",
        "images": ["/media/1780416174964-7dqc8.jpg"],
        "createdAt": "2026-05-18T14:20:34.820Z"
      }
    ],
    "appointmentDate": "2026-05-18",
    "nextAppointmentDate": "",
    "fittingDate": "",
    "eventDate": "2026-10-01",
    "dressType": "wedding",
    "branch": "cairo",
    "clientImages": ["/media/..."],
    "voiceNotes": ["https://ahmedelakad.com/voices/1780491009185-muvzq.webm"],
    "status": "active",
    "createdAt": "2026-05-18T10:38:33.820Z"
  }
]
```

**Field reference:**
- `id` — Normalized phone number (digits only), used as unique key
- `dressType` — `"wedding"` | `"evening"` | `""`
- `branch` — `"cairo"` | `"damietta"` | `""`
- `status` — `"pending"` | `"active"` | `"completed"`
- `payments` — Payment history array (calculated: paid = sum of amounts, remaining = totalPrice - paid)
- `dresses` — Dress design groups with image arrays
- `clientImages` — Reference images provided by client
- `voiceNotes` — Audio recordings stored at `https://ahmedelakad.com/voices/`

---

## Important Queries (via lib functions)

All "queries" are JSON array operations in TypeScript:

```typescript
// Get all content
import { getContent } from "@/lib/content";
const content = await getContent();

// Get all messages
import { getMessages } from "@/lib/messages";
const messages = await getMessages();

// Get all clients
import { getClients } from "@/lib/clients";
const clients = await getClients();
```

---

## Schema Migration Process

There is no migration system. Schema changes require:

1. Manually edit the JSON file on the VPS to add new fields
2. Update the TypeScript types in the relevant `src/lib/*.ts` file
3. Update API routes if new fields need to be read/written
4. Update the admin dashboard UI to expose new fields

**Example: adding a new client field**
```bash
# 1. Edit the JSON on VPS
nano /home/sherif/data/ahmed-elakad/clients.json
# Add new field to existing records manually

# 2. Update TypeScript type in src/lib/clients.ts
# 3. Update src/app/api/admin/clients/route.ts
# 4. Update src/app/atelier/page.tsx
```

---

## Long-Term Availability Risks & Mitigations

### Risk 1: VPS disk failure or VPS loss
**Impact:** All JSON data, all local images (~655 MB), and all voice notes are lost permanently.  
**Mitigation:** Set up automated daily backups (see below).

### Risk 2: Cloudinary account suspension or free-tier exceeded
**Impact:** All pre-migration legacy images (referenced in content.json as `res.cloudinary.com/...` URLs) will return 404.  
**Mitigation:** Download Cloudinary images locally and re-assign URLs in content.json via admin, OR upgrade Cloudinary plan. Free tier: 25 GB storage, 25 GB bandwidth/month.

### Risk 3: content.json corruption
**Impact:** Entire site goes blank (all pages read content.json).  
**Mitigation:** Keep daily backups. The API always does a full-JSON overwrite on save — if the process dies mid-write, the file can be partial/corrupt. Symptoms: site shows blank or throws JSON parse error.

---

## Backup Strategy

**The JSON files and the `images/` + `voices/` directories are the entire database.** They are NOT in git.

```bash
# Manual backup (run from VPS)
BACKUP_DATE=$(date +%Y%m%d)
cp -r /home/sherif/data/ahmed-elakad/ /home/sherif/backups/ahmed-elakad-$BACKUP_DATE/

# Automated daily backup (add to crontab: crontab -e)
0 3 * * * cp -r /home/sherif/data/ahmed-elakad/ /home/sherif/backups/ahmed-elakad-$(date +\%Y\%m\%d)/

# Keep only last 7 days of backups
0 4 * * * find /home/sherif/backups/ -maxdepth 1 -name "ahmed-elakad-*" -mtime +7 -exec rm -rf {} \;
```

**What to back up:**

| Path | Size | Priority |
|------|------|----------|
| `content.json` | ~13 KB | Critical — site goes blank if lost |
| `clients.json` | Grows | Critical — CRM data, no recovery |
| `messages.json` | Grows | High — contact form submissions |
| `config.json` | ~30 B | Medium — admin password (can reset manually) |
| `images/` | ~655 MB | Critical — all product photos since June 2026 |
| `voices/` | Grows | High — voice notes in Atelier |

**Note on Cloudinary images:** Legacy images uploaded before 2026-06-02 are on Cloudinary's servers. They are not in the VPS backup. Cloudinary provides its own redundancy, but if the account is lost, those image URLs will break.

---

## Nginx Configuration (for reference)

```nginx
# Serve local media images — bypasses Next.js, cached 1 year
location /media/ {
    alias /home/sherif/data/ahmed-elakad/images/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
    try_files $uri =404;
}

# Serve voice note audio files
location /voices/ {
    alias /home/sherif/data/ahmed-elakad/voices/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
    try_files $uri =404;
}
```

Config file: `/etc/nginx/sites-available/ahmedelakad.com`
