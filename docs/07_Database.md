# Database — Ahmed Elakad Couture House

## Architecture: Flat-File JSON

There is no relational database. All persistent state lives as JSON files on the VPS filesystem.

**Why no SQL database:**
- The data fits comfortably in files (content.json is ~50KB, clients.json grows at ~2KB per client)
- Single-admin write pattern — no concurrent write conflicts in practice
- Zero external dependencies to maintain (no PostgreSQL server, no connection strings)
- Backup is trivial: `cp *.json *.json.bak`
- Content is human-readable and directly editable in emergencies
- Deployment is on a single VPS — no distributed system concerns

**Limitations:**
- No concurrent write safety: two simultaneous API mutations can corrupt data by overwriting each other
- No query capability: all filtering happens in Node.js memory after loading the full array
- No transactions: a multi-step operation (e.g., add client + send email) cannot be rolled back
- No full-text search: client search in the atelier runs `.includes()` on in-memory arrays

---

## Data Directory Layout on VPS

```
/home/sherif/data/ahmed-elakad/
├── content.json          # All site content (text, image URLs, config per section)
├── clients.json          # Client CRM records (array of Client objects)
├── messages.json         # Contact form submissions (array of ContactMessage objects)
├── config.json           # Admin password
├── images/               # All uploaded media files (images + videos)
│   ├── 1719612345678-abc3x.jpg
│   ├── 1719698765432-xyz9q.mp4
│   └── ig-1719700000000.mp4
└── voices/               # Voice note audio files from Atelier CRM
    ├── 1719612345678-def4y.webm
    └── 1719698765432-ghi5z.mp3
```

Nginx serves:
- `images/` at `https://ahmedelakad.com/media/`
- `voices/` at `https://ahmedelakad.com/voices/`

---

## `content.json` — Schema

The full `SiteContent` interface (from `src/lib/content.ts`). Every field is optional.

```typescript
interface SiteContent {
  siteInfo?: {
    brandName?: string;       // e.g. "Ahmed El Akad"
    labelName?: string;       // subtitle/label name
    description?: string;     // meta description for SEO
    logo?: string;            // logo image URL
  };

  homepage?: {
    heroImage?: string;        // Full-width hero background
    heroLabel?: string;        // Small uppercase label above heading
    heroHeading?: string;      // Main hero heading
    heroSubtitle?: string;     // Subheading
    heroDescription?: string;  // Paragraph text
    heroCTAText?: string;      // CTA button label
    heroCTAHref?: string;      // CTA button URL
    collection1Image?: string; // First collection card image
    collection1Label?: string;
    collection1Href?: string;
    collection2Image?: string;
    collection2Label?: string;
    collection2Href?: string;
    collection3Image?: string;
    collection3Label?: string;
    collection3Href?: string;
    houseImage?: string;       // "House of Ahmed Elakad" section image
    houseBio?: string[];       // Array of paragraphs
    featuredImages?: string[]; // Real Brides carousel images
    ctaImage?: string;         // Bottom CTA section background
    ctaHeading?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonHref?: string;
    metaTitle?: string;
    metaDescription?: string;
    // Legacy fields (kept for compatibility):
    cta1Text?: string;
    cta1Href?: string;
    cta2Text?: string;
    cta2Href?: string;
  };

  about?: {
    title?: string;
    subtitle?: string;
    tagline?: string;
    bio?: string[];            // Array of paragraphs
    portraitImage?: string;
    sideImage?: string;
    gallery?: string[];        // Additional gallery images
    metaTitle?: string;
    metaDescription?: string;
  };

  bridal?: {
    bannerImage?: string;      // Page hero banner image
    gallery?: string[];        // Legacy (unused in current UI)
    years?: Record<string, CategoryYear>;
    // Key: year string "2022"–"2026"
    // Value: { collections: Collection[] }
  };

  couture?: {
    bannerImage?: string;
    gallery?: string[];
    years?: Record<string, CategoryYear>;
  };

  theLabelPage?: {
    metaTitle?: string;
    metaDescription?: string;
    heroImage?: string;
    gallery?: string[];
  };

  contact?: {
    pageTitle?: string;
    pageSubtitle?: string;
    phones?: string[];         // Array of phone number strings
    email?: string;
    location?: string;
    heroImage?: string;
    internationalTitle?: string;
    internationalText?: string;
    internationalImage?: string;
    metaTitle?: string;
    metaDescription?: string;
  };

  experience?: {
    heroImage?: string;
    heroSubheading?: string;
    heroHeading?: string;
    heroDescriptions?: string[];  // Array of paragraphs
    kindWordsTitle?: string;
    kindWordsIntro?: string;
    kindWordsBgImage?: string;
    testimonials?: Testimonial[];
    videoSectionTitle?: string;
    videoSectionSubtitle?: string;
    videos?: VideoItem[];
    ctaImage?: string;
    ctaHeading?: string;
    ctaSubtitle?: string;
    ctaText?: string;
    metaTitle?: string;
    metaDescription?: string;
  };

  social?: {
    pinterest?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    threads?: string;
    tiktok?: string;
  };

  footer?: {
    copyright?: string;
    creditText?: string;
    creditLink?: string;
  };
}

interface CategoryYear {
  collections: Collection[];
}

interface Collection {
  id: string;           // UUID-like random string
  name?: string;        // Optional collection name (e.g., "Spring Collection")
  images: string[];     // Array of full URLs (https://ahmedelakad.com/media/...)
  coverIndex?: number;  // Index into images[] for the cover thumbnail
}

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  subtitle: string;
  rating?: number;
}

interface VideoItem {
  id: string;
  url: string;
  title?: string;
  clientName?: string;
  clientSubtitle?: string;
}
```

---

## `clients.json` — Schema

Array of `Client` objects:

```typescript
interface Client {
  id: string;                          // Normalized phone digits only (primary key)
  name: string;
  email: string;
  phone: string;                       // Raw phone string (may include country code, spaces)
  notes: string;                       // Free-text notes
  totalPrice: number;                  // Total agreed price in EGP
  payments: Payment[];                 // Payment history
  dresses: Dress[];                    // Dress orders with images
  voiceNotes: VoiceNote[];             // Audio notes from atelier/admin
  appointmentDate: string;             // ISO date string (YYYY-MM-DD) or ""
  appointmentTime: string;             // "HH:mm" or ""
  nextAppointmentDate: string;         // ISO date string or ""
  fittingDate: string;                 // ISO date string or ""
  fittingTime: string;                 // "HH:mm" or ""
  eventDate: string;                   // Wedding/event date (ISO) or ""
  dressType: "wedding" | "evening" | "";
  branch: "cairo" | "damietta" | "";
  clientImages: string[];              // Reference images uploaded by admin (URLs)
  status: "active" | "completed" | "pending";  // Auto-computed from payments
  createdAt: string;                   // ISO timestamp
  sourceMessageId?: string;            // ID of contact message if client was created from one
}

interface Payment {
  id: string;      // Random base-36 9-char string
  amount: number;  // Amount in EGP
  date: string;    // ISO date string (YYYY-MM-DD)
  note: string;    // Free-text payment note (e.g., "deposit", "final payment")
}

interface Dress {
  id: string;         // Random base-36 9-char string
  label: string;      // Dress name/description
  images: string[];   // URLs of dress photos (stored in local /media/)
  createdAt: string;  // ISO timestamp
}

interface VoiceNote {
  id: string;                       // Random base-36 9-char string
  url: string;                      // https://ahmedelakad.com/voices/{filename}
  from: "atelier" | "admin";        // Source of the voice note
  createdAt: string;                // ISO timestamp
}
```

**Status Auto-Computation:**
```typescript
function autoStatus(client: Client): "active" | "completed" | "pending" {
  const paid = client.payments.reduce((s, p) => s + p.amount, 0);
  if (client.totalPrice > 0 && paid >= client.totalPrice) return "completed";
  if (paid > 0) return "active";
  return "pending";
}
```

`status` is recomputed every time a payment is added, updated, or deleted. The stored value is always consistent with the payment data.

---

## `messages.json` — Schema

Array of `ContactMessage` objects:

```typescript
interface ContactMessage {
  id: string;        // Random base-36 9-char string
  name: string;      // Sender's name (required)
  email: string;     // Sender's email (may be "")
  phone: string;     // Sender's phone (may be "")
  message: string;   // Message body (required)
  createdAt: string; // ISO timestamp
  read?: boolean;    // Whether the admin has read it
}
```

New messages are prepended (newest first):
```typescript
writeLocal([newMsg, ...messages]);
```

---

## `config.json` — Schema

```typescript
interface SiteConfig {
  adminPassword: string;  // Plaintext admin password
}
```

Default if file missing:
```typescript
return { adminPassword: process.env.ADMIN_PASSWORD ?? "114891" };
```

The password from `config.json` takes precedence over the env var. The env var is only a fallback for fresh deployments.

---

## `atomicWrite.ts` — Implementation

```typescript
import fs from "fs";
import path from "path";

export function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, `.${base}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}
```

JSON is formatted with 2-space indentation (`JSON.stringify(data, null, 2)`), making the files human-readable in emergencies.

---

## Backup Considerations

No automated backup is configured. Manual backup approach:
```bash
cp /home/sherif/data/ahmed-elakad/content.json /home/sherif/data/ahmed-elakad/content.json.bak
cp /home/sherif/data/ahmed-elakad/clients.json /home/sherif/data/ahmed-elakad/clients.json.bak
```

For images, they are served by Nginx directly from disk. They are not stored in `content.json` by value — only the URL strings are stored. The actual files in `images/` and `voices/` directories should be backed up separately.

A `.tmp` file left over from a crashed write (`/home/sherif/data/ahmed-elakad/.content.json.tmp`) can be safely deleted — it is always a newer version that failed to replace the target.
