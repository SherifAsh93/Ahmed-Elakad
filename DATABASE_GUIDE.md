# Ahmed Elakad Couture — Database Guide

## Database Provider

**No SQL database.** All data is stored in JSON files on the VPS disk.

- **Location:** `/home/sherif/data/ahmed-elakad/` (external to repo, never committed to git)
- **Format:** Plain JSON files, read/written by Next.js API routes at runtime
- **ORM/Query Layer:** None — `src/lib/atomicWrite.ts` wraps all writes via `fs.writeFileSync` + `fs.renameSync` (atomic)

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
**Severity:** Critical  
**Impact:** All JSON data, all local images (~655 MB), and all voice notes are permanently lost.  
**Mitigation:** ✅ Daily automated backup to Windows D: drive (see Backup Strategy below). First backup completed 2026-06-04. Restore test passed.

### Risk 2: content.json corruption mid-write
**Severity:** Critical (site goes blank instantly)  
**Impact:** All pages read content.json on every request — a corrupt file takes the entire site down.  
**Mitigation:** ✅ Atomic writes via `atomicWriteJSON()` — writes to `.tmp` then renames. Readers always see a complete file. Pre-existing backups allow point-in-time recovery.

### Risk 3: Cloudinary account suspension or free-tier exceeded
**Severity:** High  
**Impact:** All pre-migration legacy images (URLs like `res.cloudinary.com/dzppk5ylt/...`) return 404. These are the older collection photos from before June 2026.  
**Free tier limits:** 25 GB storage · 25 GB bandwidth/month  
**Mitigation:** No automated mitigation. Options: (a) migrate legacy images via admin grab-URL, (b) upgrade Cloudinary plan. Check usage at cloudinary.com dashboard.

### Risk 4: NoMachine offline during backup window
**Severity:** Low  
**Impact:** One day's backup is skipped. Data on VPS is unchanged.  
**Mitigation:** ✅ Script detects inaccessibility within 5 seconds, logs warning, exits cleanly. Health check shows last-success timestamp so gaps are visible. Only becomes a problem if the machine stays off for >30 days (older than the retention window).

### Risk 5: VPS disk fills up (no room for new images)
**Severity:** High  
**Impact:** Image uploads fail; if full, JSON writes could also fail and corrupt data.  
**Current state:** 23% used (19 GB of 96 GB). Health check warns at 85%.  
**Mitigation:** Health check monitors disk usage. At current growth rate (~655 MB / first 2 months), the disk is sufficient for years.

### Risk 6: Backup destination fills up (D: drive)
**Severity:** Medium  
**Impact:** rsync fails silently; backup script may report PARTIAL or ERROR.  
**Mitigation:** Script logs all rsync failures. With 30-snapshot retention and ~655 MB per snapshot (first copy), worst case is ~19 GB on D: drive. Subsequent snapshots only copy new files.

---

## Atomic Writes

All JSON writes use an atomic write helper (`src/lib/atomicWrite.ts`) to prevent file corruption:

```typescript
// Pattern used in all lib/*.ts write functions:
atomicWriteJSON(filePath, data);
// → writes data to <file>.tmp on the same filesystem
// → renames .tmp → target (POSIX rename() is atomic)
// Result: readers always see a complete file, never a partial write
```

This protects against process crashes mid-write. The temp file (`.content.json.tmp` etc.) is a sibling of the target, ensuring both live on the same filesystem so the rename stays atomic.

---

## Backup Strategy

**The JSON files and the `images/` + `voices/` directories are the entire database.** They are NOT in git.

### Automated Daily Backup to Windows D: Drive

#### Schedule

| Property | Value |
|----------|-------|
| Cron schedule | `0 3 * * *` — 03:00 daily |
| Server timezone | UTC (`timedatectl` verified) |
| Local (Egypt) time | 06:00 EEST (UTC+3, summer) / 05:00 EET (UTC+2, winter) |
| First backup completed | 2026-06-04 |

View cron entry:
```bash
crontab -l
# → 0 3 * * * /home/sherif/sites/Ahmed-Elakad/scripts/backup-ahmed-elakad.sh >> .../logs/backup.log 2>&1
```

#### Paths

| Role | Path |
|------|------|
| Script | `/home/sherif/sites/Ahmed-Elakad/scripts/backup-ahmed-elakad.sh` |
| Local log | `/home/sherif/sites/Ahmed-Elakad/logs/backup.log` |
| Last-success marker | `/home/sherif/sites/Ahmed-Elakad/logs/last_backup_success` |
| Source data | `/home/sherif/data/ahmed-elakad/` |
| D: drive mount | `/home/sherif/Desktop/D on Player (NoMachine)/` (sshfs via NoMachine) |
| Backup root (Linux) | `/home/sherif/Desktop/D on Player (NoMachine)/Development/01-Projects/ahmed-elakad/backup/` |
| Backup root (Windows) | `D:\Development\01-Projects\ahmed-elakad\backup\` |

#### What Gets Backed Up

| File / Dir | Size | Priority | Notes |
|-----------|------|----------|-------|
| `content.json` | ~108 KB | Critical | Site blank if missing |
| `clients.json` | ~15 KB | Critical | CRM — no other copy |
| `messages.json` | grows | High | Contact submissions |
| `config.json` | ~30 B | Medium | Admin pw — can reset manually |
| `images/` | ~655 MB | Critical | All photos since June 2026 |
| `voices/` | grows | High | Client voice notes |

Cloudinary legacy images (pre-June 2026) are **not** backed up — Cloudinary manages its own redundancy.

#### Backup Structure (two zones)

```
backup/
├── snapshots/                        ← Versioned JSON + voices (small, fast)
│   ├── 2026-06-04_18-06-52/
│   │   ├── content.json
│   │   ├── clients.json
│   │   ├── messages.json             (skipped if not yet created)
│   │   ├── config.json               (skipped if not yet created)
│   │   ├── voices/                   (rsync copy — backed up BEFORE images)
│   │   └── .backup_status            ← "OK timestamp" or "PARTIAL timestamp"
│   ├── 2026-06-05_03-00-01/
│   └── ...
├── images-latest/                    ← Single rolling rsync of all images
│   ├── 1780416174964-7dqc8.jpg
│   └── ...                           (only new/changed files sent each night)
└── .last_success                     ← timestamp of last fully clean backup
```

**Why split?** JSON + voices are tiny and version-worthy. Images are 655 MB and mostly append-only — keeping one rolling sync directory means only new uploads are transferred each night (seconds, not hours).

**rsync flags for images:** `--inplace --partial --delete`
- `--inplace`: writes directly to destination, no temp file (avoids `mkstemp` errors on sshfs drops)
- `--partial`: keeps partially-transferred files so retries resume rather than restart
- `--delete`: removes images from backup if deleted from source

**Retry logic:** rsync attempts up to 3 times with a 30-second pause between attempts, so a brief sshfs hiccup doesn't fail the whole backup.

#### Retention

- `snapshots/`: 30 most-recent kept, older auto-deleted. Each snapshot is ~125 KB (JSON only) + voice files. Total footprint of 30 snapshots: well under 100 MB.
- `images-latest/`: single directory, no rotation. Always mirrors the current images.

#### When Windows Is Offline

The script probes the mount root with a 5-second `timeout`. If the machine is off or NoMachine is disconnected:
- Logs: `[WARN] D: drive not accessible — skipping backup.`
- Exits with code 0 (no cron failure mail)
- Site is completely unaffected
- One missed night is safe — 30 snapshots keep 30 days of JSON history

#### Transfer Duration

| Run | JSON + voices | Images | Total |
|-----|--------------|--------|-------|
| First ever | ~1 s | ~3–4 h over sshfs | ~3–4 h (one-time) |
| Nightly (no new images) | ~1 s | ~5 s | ~6 s |
| Nightly (100 new images) | ~1 s | ~2–3 min | ~3 min |

The first backup was initiated 2026-06-04 at 16:45 UTC and transferred images at ~4 MB/min over the sshfs/NoMachine link. All future nightly runs are incremental.

### Manual Backup (on demand)
```bash
bash /home/sherif/sites/Ahmed-Elakad/scripts/backup-ahmed-elakad.sh
# Logs to logs/backup.log and the D: drive simultaneously
```

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

---

## Health Check

Run anytime to get a full status report:

```bash
bash /home/sherif/sites/Ahmed-Elakad/scripts/health-check-ahmed-elakad.sh
```

Checks:
1. **JSON files** — all four exist and are valid JSON
2. **Disk space** — warns above 85% full, shows images/ and voices/ sizes
3. **Directories** — images/ and voices/ exist and are writable
4. **PM2** — "ahmed-elakad" process is online (shows memory, CPU, uptime)
5. **Nginx** — service is active
6. **Backup** — D: drive accessible, last-success timestamp and snapshot count

Exit code 0 = healthy, 1 = one or more errors detected.

---

## Disaster Recovery

> **Restore test verified 2026-06-04:** content.json and clients.json restored from backup snapshot to a temp directory; md5 matched source exactly; JSON parsed successfully (11 sections, 23 clients, 20 payment records).

### Find the right snapshot

```bash
BACKUP_ROOT="/home/sherif/Desktop/D on Player (NoMachine)/Development/01-Projects/ahmed-elakad/backup"
SNAP_ROOT="${BACKUP_ROOT}/snapshots"

# List all snapshots newest-first
ls "${SNAP_ROOT}" | sort -r | head -10

# Check if a specific snapshot completed cleanly
cat "${SNAP_ROOT}/2026-06-04_18-06-52/.backup_status"
# → "OK 2026-06-04_18-06-52" means clean
# → "PARTIAL ..." means rsync had errors — try the previous snapshot

# Read last confirmed success
cat "/home/sherif/sites/Ahmed-Elakad/logs/last_backup_success"
```

---

### Scenario 1: Single JSON file corrupted (fastest restore, site stays up)

Symptoms: site shows blank page, PM2 logs show `JSON parse error`, or one CMS section is missing.

```bash
BACKUP_ROOT="/home/sherif/Desktop/D on Player (NoMachine)/Development/01-Projects/ahmed-elakad/backup"
SNAP="${BACKUP_ROOT}/snapshots/YYYY-MM-DD_HH-MM-SS"   # pick newest clean snapshot

# Validate the backup file before restoring
python3 -c "import json; json.load(open('${SNAP}/content.json'))" && echo "Backup is valid JSON"

# Restore — atomicWrite guarantees no partial file on disk
cp "${SNAP}/content.json" /home/sherif/data/ahmed-elakad/content.json

# Verify site responds
curl -sI https://ahmedelakad.com | head -3
pm2 logs ahmed-elakad --lines 10
```

No PM2 restart needed — Next.js reads content.json on every request (no in-memory cache).

---

### Scenario 2: Full data directory recovery

Use when multiple files are lost or the entire `/home/sherif/data/ahmed-elakad/` is damaged.

```bash
BACKUP_ROOT="/home/sherif/Desktop/D on Player (NoMachine)/Development/01-Projects/ahmed-elakad/backup"
SNAP="${BACKUP_ROOT}/snapshots/YYYY-MM-DD_HH-MM-SS"   # pick newest clean snapshot

# 1. Prevent new writes during restore
pm2 stop ahmed-elakad

# 2. Restore JSON files from snapshot
for f in content.json clients.json messages.json config.json; do
  [[ -f "${SNAP}/${f}" ]] && cp "${SNAP}/${f}" /home/sherif/data/ahmed-elakad/ && echo "Restored ${f}"
done

# 3. Restore voices from snapshot
rsync -a "${SNAP}/voices/" /home/sherif/data/ahmed-elakad/voices/

# 4. Restore images from rolling images-latest/
rsync -a --info=progress2 "${BACKUP_ROOT}/images-latest/" /home/sherif/data/ahmed-elakad/images/

# 5. Restart
pm2 start ahmed-elakad
pm2 logs ahmed-elakad --lines 20

# 6. Verify
bash /home/sherif/sites/Ahmed-Elakad/scripts/health-check-ahmed-elakad.sh
```

**Downtime:** Only the `pm2 stop` → `pm2 start` window (~seconds). JSON + voices restore is instant. Image rsync runs in background after PM2 is back up — images not yet synced show as 404 until rsync completes.

---

### Scenario 3: VPS lost entirely — rebuild from scratch

```bash
# On new VPS (Ubuntu 22.04+ recommended):

# 1. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx rsync
npm install -g pm2

# 2. Restore SSH + NoMachine access to Windows machine
#    (so the D: drive can be mounted again)

# 3. Clone repo
git clone https://github.com/SherifAsh93/Ahmed-Elakad.git /home/sherif/sites/Ahmed-Elakad

# 4. Create data directories
mkdir -p /home/sherif/data/ahmed-elakad/{images,voices}

# 5. Mount D: drive via sshfs (adjust Windows IP/user as needed)
#    NoMachine typically handles this automatically on connect

# 6. Copy latest clean backup
BACKUP_ROOT="<windows-backup-root>/Development/01-Projects/ahmed-elakad/backup"
SNAP="${BACKUP_ROOT}/snapshots/YYYY-MM-DD_HH-MM-SS"
cp "${SNAP}"/content.json  /home/sherif/data/ahmed-elakad/
cp "${SNAP}"/clients.json  /home/sherif/data/ahmed-elakad/
rsync -a "${SNAP}/voices/" /home/sherif/data/ahmed-elakad/voices/
rsync -a "${BACKUP_ROOT}/images-latest/" /home/sherif/data/ahmed-elakad/images/

# 7. Configure .env.local — see SETUP_GUIDE.md
# 8. Configure Nginx — see SETUP_GUIDE.md
# 9. Build and start
cd /home/sherif/sites/Ahmed-Elakad
npm install && npm run build
pm2 start npm --name ahmed-elakad -- start
pm2 save && pm2 startup

# 10. SSL
sudo certbot --nginx -d ahmedelakad.com -d www.ahmedelakad.com

# 11. Reinstall cron
crontab -e
# → 0 3 * * * /home/sherif/sites/Ahmed-Elakad/scripts/backup-ahmed-elakad.sh >> .../logs/backup.log 2>&1
```
