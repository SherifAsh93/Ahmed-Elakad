# API Reference — Ahmed Elakad Couture House

All API routes live under `src/app/api/`. All return `application/json`. All use `export const dynamic = "force-dynamic"` unless noted.

---

## `GET /api/auth`

**Auth required:** Yes (checks if session exists)
**Purpose:** Verify that the current browser session is authenticated.

**Response:**
- `200 { ok: true }` — session is valid
- `401 { error: "Unauthorized" }` — no valid session

---

## `POST /api/auth`

**Auth required:** No
**Purpose:** Log in — exchange password for session cookie.

**Request body:**
```json
{ "password": "string" }
```

**Response:**
- `200 { ok: true }` — sets `admin_session=authenticated` cookie (httpOnly, secure in prod, sameSite: lax, maxAge: 2592000s / 30 days)
- `401 { error: "Invalid password" }` — wrong password

**Side effects:** Sets the `admin_session` cookie in the `Set-Cookie` response header.

---

## `DELETE /api/auth`

**Auth required:** No (logout always succeeds)
**Purpose:** Destroy the admin session.

**Response:**
- `200 { ok: true }` — cookie is cleared via `res.cookies.delete("admin_session")`

---

## `GET /api/content`

**Auth required:** No (content is public data)
**Purpose:** Read the full site content object.

**Response:**
- `200` — full `SiteContent` JSON object (may be `{}` if content.json is missing/empty)

---

## `POST /api/content`

**Auth required:** Yes
**Purpose:** Overwrite the entire site content object.

**Request body:** Full `SiteContent` JSON object.

**Response:**
- `200 { ok: true }` — content saved; refreshes session cookie; calls `revalidatePath("/", "layout")`
- `401 { error: "Unauthorized" }` — no valid session
- `400 { error: "Invalid JSON" }` — malformed request body

**Side effects:** Writes `content.json` via `atomicWriteJSON`. Calls `revalidatePath`.

---

## `GET /api/images`

**Auth required:** No
**Purpose:** List all available images (local disk + legacy Cloudinary). Used by the admin image picker.

**Query params:**
- `?nocache=1` — forces cache invalidation, fetches fresh data

**Response:**
```json
{
  "images": ["https://ahmedelakad.com/media/...", "https://res.cloudinary.com/..."],
  "thumbnails": {
    "https://res.cloudinary.com/...": "https://res.cloudinary.com/...?w=400&h=500&crop=fill..."
  }
}
```

- `images`: deduped array, local images first (sorted newest-first by timestamp prefix), then Cloudinary
- `thumbnails`: only populated for Cloudinary images (local images go through `/_next/image` for thumbnails)
- Deleted URLs (in `excludedUrls` Set) are filtered out

**Cache:** 30-second in-process memory cache. Bypassed with `?nocache=1`.

**Headers returned:** `Cache-Control: private, no-store`

---

## `POST /api/upload`

**Auth required:** Yes
**Purpose:** Upload one or more image or video files.

**Request:** `multipart/form-data` — any number of files in `files` field.

**Response:**
```json
{ "ok": true, "uploaded": ["https://ahmedelakad.com/media/filename.jpg"] }
```

**Error responses:**
- `401 { error: "Unauthorized" }`
- `500 { error: "Upload Error: ..." }`

**Side effects:**
- Saves files to `/home/sherif/data/ahmed-elakad/images/`
- For non-mp4/webm videos: runs FFmpeg conversion (libx264, aac, faststart), may take up to 5 minutes
- Returns URLs as `https://ahmedelakad.com/media/{timestamp}-{random}.{ext}`

---

## `DELETE /api/upload`

**Auth required:** Yes
**Purpose:** Delete an uploaded file by URL.

**Request body:**
```json
{ "url": "https://ahmedelakad.com/media/filename.jpg" }
```

**Response:**
- `200 { ok: true }` — file deleted
- `200 { ok: true, result: "not found" }` — Cloudinary image was already gone
- `400 { error: "url required" }` — missing url field
- `400 { error: "invalid url" }` — not a recognizable URL format
- `401 { error: "Unauthorized" }`
- `500 { error: "Delete failed" }`

**Side effects:**
- For local URLs (`ahmedelakad.com/media/`): deletes the file from disk, adds URL to `excludedUrls` Set
- For Cloudinary URLs: calls `cloudinary.uploader.destroy(publicId)`, adds URL to `excludedUrls` Set

---

## `POST /api/upload/voice`

**Auth required:** No (atelier staff access)
**Purpose:** Upload a voice note audio file.

**Request:** `multipart/form-data` with `file` field.

**Allowed MIME types:** `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/aac`
**Max size:** 10 MB

**Response:**
```json
{ "url": "https://ahmedelakad.com/voices/filename.webm" }
```

**Error responses:**
- `400 { error: "No file provided" }`
- `400 { error: "File too large (max 10 MB)" }`
- `400 { error: "Unsupported audio format" }`
- `500 { error: "Upload failed" }`

**Side effects:** Saves file to `/home/sherif/data/ahmed-elakad/voices/`

---

## `POST /api/contact`

**Auth required:** No
**Purpose:** Submit a contact form message.

**Request body:**
```json
{
  "name": "string",          // required
  "email": "string",         // optional
  "phone": "string",         // optional
  "message": "string"        // required
}
```

**Response:**
- `200 { ok: true, message: ContactMessage }` — message saved
- `400 { error: "Missing required fields" }` — name or message missing
- `500 { error: "Internal Server Error" }`

**Side effects:** Prepends new `ContactMessage` to `messages.json` via `atomicWriteJSON`.

---

## `POST /api/grab-url`

**Auth required:** Yes
**Purpose:** Fetch a remote image URL and save it to local storage.

**Request body:**
```json
{ "url": "string" }
```

**Response:**
```json
{ "cloudinaryUrl": "https://ahmedelakad.com/media/filename.jpg" }
```

If the URL is already a local media or Cloudinary URL:
```json
{ "cloudinaryUrl": "...", "alreadySynced": true }
```

**Error responses:**
- `400 { error: "No URL provided" }`
- `401 { error: "Unauthorized" }`
- `422 { error: "..." }` — URL not fetchable, no image found, unsupported content type
- `500 { error: "..." }` — fetch error

**Side effects:** Saves downloaded image to `/home/sherif/data/ahmed-elakad/images/`.

---

## `POST /api/ig-video`

**Auth required:** Yes
**Purpose:** Download an Instagram video using yt-dlp.

**Request body:**
```json
{ "url": "https://www.instagram.com/p/..." }
```

**Response:**
```json
{ "url": "https://ahmedelakad.com/media/ig-1719700000000.mp4" }
```

**Error responses:**
- `400 { error: "No URL provided" }`
- `400 { error: "Not an Instagram URL" }` — URL doesn't match `/p/|/reel/|/tv/` pattern
- `401 { error: "Unauthorized" }`
- `500 { error: "Download failed: ..." }`
- `503 { error: "Instagram session not available. ..." }` — no cookie file or Playwright profile found

**Side effects:** Saves mp4 to `/home/sherif/data/ahmed-elakad/images/ig-{timestamp}.mp4`. Takes up to 90 seconds.

---

## `GET /api/admin/clients`

**Auth required:** No
**Purpose:** Fetch all clients. Used by both admin dashboard and atelier page.

**Response:** Array of `Client` objects, sorted newest-first (new clients are prepended).

Returns only clients with valid phone numbers (≥7 digits after normalization).

---

## `POST /api/admin/clients`

**Auth required:** No
**Purpose:** Create a new client.

**Request body:**
```json
{
  "phone": "string",          // required — used as primary key
  "name": "string",
  "email": "string",
  "notes": "string",
  "totalPrice": 0,
  "appointmentDate": "",
  "appointmentTime": "",
  "nextAppointmentDate": "",
  "fittingDate": "",
  "fittingTime": "",
  "eventDate": "",
  "dressType": "",
  "branch": "",
  "clientImages": [],
  "status": "pending",
  "sourceMessageId": "string" // optional
}
```

**Response:**
- `201 Client` — client created
- `400 { error: "Mobile number is required" }` — phone missing
- `400 { error: "A client with this mobile number already exists" }` — duplicate phone

**Side effects:** Prepends client to `clients.json`.

---

## `PUT /api/admin/clients`

**Auth required:** No
**Purpose:** Update a client, or perform a sub-operation via action dispatch.

**Base request:**
```json
{ "id": "string", "action": "string (optional)", ...data }
```

If no `action` is provided, performs a general field update (`updateClient`).

### Action Dispatch Table

| `action` | Additional fields | Effect |
|---|---|---|
| `"addPayment"` | `amount: number, date: string, note: string` | Appends payment to `client.payments`, recomputes status |
| `"updatePayment"` | `paymentId: string, amount?: number, date?: string, note?: string` | Updates existing payment, recomputes status |
| `"deletePayment"` | `paymentId: string` | Removes payment, recomputes status |
| `"addDress"` | `label: string` | Appends new dress with empty `images[]` |
| `"deleteDress"` | `dressId: string` | Removes dress (images URLs remain in storage) |
| `"addDressImages"` | `dressId: string, images: string[]` | Appends image URLs to dress.images |
| `"removeDressImage"` | `dressId: string, imageUrl: string` | Removes one image URL from dress.images |
| `"updateDressLabel"` | `dressId: string, label: string` | Renames the dress label |
| `"addVoiceNote"` | `url: string, from: "atelier"\|"admin"` | Appends voice note to client.voiceNotes |
| `"deleteVoiceNote"` | `voiceNoteId: string` | Removes voice note record + deletes audio file from disk |
| _(no action)_ | Any updatable Client fields | Merges fields into client record |

**Response:** Updated `Client` object on success.

**Error responses:**
- `400 { error: "id required" }`
- `404 { error: "not found" }` — client ID doesn't exist

---

## `DELETE /api/admin/clients`

**Auth required:** No
**Purpose:** Delete a client record.

**Request body:** `{ "id": "string" }`

**Response:**
- `200 { ok: true }`
- `400 { error: "id required" }`

**Side effects:** Removes client from `clients.json`. Does NOT delete associated dress images or voice notes from disk.

---

## `GET /api/admin/messages`

**Auth required:** Yes
**Purpose:** Fetch all contact form messages.

**Response:** Array of `ContactMessage` objects, newest first.

---

## `DELETE /api/admin/messages`

**Auth required:** Yes
**Purpose:** Delete a contact message.

**Request body:** `{ "id": "string" }`

**Response:**
- `200 { ok: true }`
- `400 { error: "Missing id" }`

---

## `PATCH /api/admin/messages`

**Auth required:** Yes
**Purpose:** Mark a message as read or unread.

**Request body:** `{ "id": "string", "read": boolean }`

**Response:**
- `200 { ok: true }`
- `400 { error: "Missing fields" }`

---

## `POST /api/admin/reorder`

**Auth required:** Yes
**Purpose:** Replace the collections array for a given section/year (used for drag-to-reorder).

**Request body:**
```json
{
  "section": "bridal" | "couture",
  "year": "2025",
  "collections": [ ...Collection[] ]
}
```

**Response:**
- `200 { ok: true }` — saves and calls `revalidatePath`
- `400 { error: "Invalid payload" }` — missing fields
- `400 { error: "Invalid section" }` — not bridal or couture
- `401 { error: "Unauthorized" }`
- `404 { error: "Year not found" }` — year key doesn't exist in content

**Side effects:** Overwrites `content[section].years[year].collections` in content.json. Calls `revalidatePath("/{section}/[year]", "page")` and `revalidatePath("/{section}/all")`.

---

## `POST /api/admin/reorder-images`

**Auth required:** Yes
**Purpose:** Replace the images array within a specific collection (used for drag-to-reorder + cover selection).

**Request body:**
```json
{
  "section": "bridal" | "couture",
  "year": "2025",
  "collectionId": "string",
  "images": ["url1", "url2"],
  "coverIndex": 0
}
```

**Response:**
- `200 { ok: true }`
- `400 { error: "Invalid payload" }`
- `401 { error: "Unauthorized" }`
- `404 { error: "Year not found" }` or `{ error: "Collection not found" }`

**Side effects:** Updates `collection.images` and optionally `collection.coverIndex`. Calls `revalidatePath`.

---

## `POST /api/admin/cover`

**Auth required:** Yes
**Purpose:** Set the cover image index for a collection.

**Request body:**
```json
{
  "section": "bridal" | "couture",
  "year": "2025",
  "collectionId": "string",
  "coverIndex": 0
}
```

**Response:**
- `200 { ok: true }`
- `400 { error: "Invalid payload" }` — coverIndex must be a number
- `401 { error: "Unauthorized" }`
- `404 { error: "Year not found" }` or `{ error: "Collection not found" }`

**Side effects:** Sets `collection.coverIndex`, saves content.json, calls `revalidatePath`.

---

## `PUT /api/admin/config`

**Auth required:** Yes
**Purpose:** Change the admin password.

**Request body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"  // minimum 4 characters
}
```

**Response:**
- `200 { ok: true }` — password updated
- `400 { error: "Password must be at least 4 characters" }`
- `401 { error: "Unauthorized" }` — not logged in
- `401 { error: "Current password is incorrect" }` — wrong current password

**Side effects:** Overwrites `config.json` via `atomicWriteJSON`.
