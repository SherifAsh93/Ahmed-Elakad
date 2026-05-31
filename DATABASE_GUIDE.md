# Ahmed Elakad Couture — Database Guide

## Database Provider

**No SQL database.** All data is stored in JSON files on the VPS disk.

- **Location:** `/home/sherif/data/ahmed-elakad/` (external to repo, not deployed to Vercel)
- **Format:** Plain JSON files, read/written by Next.js API routes at runtime
- **ORM/Query Layer:** None — raw `fs.readFileSync` / `fs.writeFileSync` via helper modules in `src/lib/`

This design means the site **must run on the VPS** (not Vercel serverless) for data persistence to work. Vercel deployments cannot write to disk.

---

## Schema Overview

Four JSON files act as the "tables":

| File | Purpose | Rough Size |
|------|---------|------------|
| `config.json` | Admin password | ~30 bytes |
| `content.json` | All public site content | ~13 KB |
| `messages.json` | Contact form submissions | grows over time |
| `clients.json` | Client/order CRM records | grows over time |

---

## Files and Their Structure

### `config.json`
```json
{
  "adminPassword": "114891"
}
```
- Read by `src/lib/config.ts → getAdminPassword()`
- Written by `src/app/api/admin/config/route.ts` (PUT) when admin changes password
- Also compared against `ADMIN_PASSWORD` env var on login

---

### `content.json`
All public site content. Edited via the admin dashboard.

```json
{
  "siteInfo": {
    "brandName": "Ahmed Elakad",
    "labelName": "Couture",
    "description": "...",
    "logo": "cloudinary_url"
  },
  "homepage": {
    "heroImage": "cloudinary_url",
    "featuredImages": ["url1", "url2"],
    "ctaText": "Find Your Dress",
    "ctaLink": "/bridal",
    "secondaryCtaText": "Book an Appointment",
    "secondaryCtaLink": "/contact",
    "meta": { "title": "...", "description": "..." }
  },
  "about": {
    "title": "About Ahmed",
    "subtitle": "...",
    "bio": ["paragraph1", "paragraph2"],
    "portraitImage": "cloudinary_url",
    "sideImage": "cloudinary_url",
    "meta": { "title": "...", "description": "..." }
  },
  "bridal": {
    "bannerImage": "cloudinary_url",
    "years": {
      "2026": {
        "collections": [
          {
            "id": "unique_id",
            "name": "Collection Name",
            "images": ["cloudinary_url1", "cloudinary_url2"]
          }
        ]
      },
      "2025": { "collections": [...] },
      "2024": { ... },
      ...
    }
  },
  "couture": {
    "bannerImage": "cloudinary_url",
    "years": { /* same structure as bridal */ }
  },
  "contact": {
    "pageTitle": "Contact Us",
    "pageSubtitle": "...",
    "phones": ["+20 ...", "+20 ..."],
    "email": "...",
    "location": "Cairo, Egypt",
    "heroImage": "cloudinary_url",
    "meta": { "title": "...", "description": "..." }
  },
  "social": {
    "instagram": "https://instagram.com/...",
    "facebook": "https://facebook.com/...",
    "whatsapp": "https://wa.me/..."
  },
  "footer": {
    "copyright": "© 2026 Ahmed Elakad",
    "creditText": "Built by ...",
    "creditLink": "https://..."
  }
}
```

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

- Read by `src/lib/messages.ts → getMessages()`
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
        "images": ["cloudinary_url1"],
        "createdAt": "2026-05-18T14:20:34.820Z"
      }
    ],
    "appointmentDate": "2026-05-18",
    "nextAppointmentDate": "",
    "fittingDate": "",
    "eventDate": "2026-10-01",
    "dressType": "wedding",
    "branch": "cairo",
    "clientImages": ["cloudinary_url"],
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

// Add a payment to client
// Done via PUT /api/admin/clients with action: "add-payment"

// Add a dress to client
// Done via PUT /api/admin/clients with action: "add-dress"

// Change admin password
// Done via PUT /api/admin/config
```

---

## Migration Process

There is no migration system. Schema changes require:

1. Manually edit the JSON file on the VPS to add new fields
2. Update the TypeScript types in the relevant `src/lib/*.ts` file
3. Update API routes if new fields need to be read/written
4. Update the admin dashboard UI to expose new fields

**Example: adding a new client field**
```bash
# 1. Edit the JSON on VPS
nano /home/sherif/data/ahmed-elakad/clients.json
# Add new field to existing records manually or via a migration script

# 2. Update TypeScript type in src/lib/clients.ts
# 3. Update src/app/api/admin/clients/route.ts
# 4. Update src/app/atelier/page.tsx
```

---

## Backup Considerations

**The JSON files are the database.** They are NOT in git (they live outside the repo).

**Backup strategy:**
```bash
# Manual backup
cp -r /home/sherif/data/ahmed-elakad/ /home/sherif/backups/ahmed-elakad-$(date +%Y%m%d)/

# Automated daily backup (add to crontab)
0 2 * * * cp -r /home/sherif/data/ahmed-elakad/ /home/sherif/backups/ahmed-elakad-$(date +\%Y\%m\%d)/
```

**What to back up:**
- `/home/sherif/data/ahmed-elakad/content.json` — site content (critical)
- `/home/sherif/data/ahmed-elakad/clients.json` — client CRM (critical)
- `/home/sherif/data/ahmed-elakad/messages.json` — contact form submissions
- `/home/sherif/data/ahmed-elakad/config.json` — admin password

**Cloudinary images** are stored on Cloudinary's servers — they are independently backed up by Cloudinary. The URLs stored in JSON files point to Cloudinary-hosted images.
