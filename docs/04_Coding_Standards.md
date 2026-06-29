# Coding Standards — Ahmed Elakad Couture House

## File & Directory Naming

| Type | Convention | Examples |
|---|---|---|
| React components | `PascalCase.tsx` | `Navbar.tsx`, `CollectionGrid.tsx`, `RealBridesCarousel.tsx` |
| Library modules | `camelCase.ts` | `content.ts`, `atomicWrite.ts`, `compressImage.ts` |
| API routes | `route.ts` inside a folder | `app/api/upload/route.ts` |
| Page files | `page.tsx` | `app/bridal/[year]/page.tsx` |
| Layout files | `layout.tsx` | `app/admin/layout.tsx` |
| Stylesheets | `globals.css` (single global file) | — |

## TypeScript Patterns

### Interface over Type

All data shapes use `interface`, not `type`:
```typescript
// Correct (from content.ts)
export interface Collection {
  id: string;
  name?: string;
  images: string[];
  coverIndex?: number;
}

// Not used in this codebase
type Collection = { ... }
```

### Optional Chaining for Nullable Content

All content reads use optional chaining because every field in `SiteContent` is optional (`?`). This pattern appears consistently throughout all page components:
```typescript
const brand = content.siteInfo?.brandName ?? "Ahmed El Akad";
const heroImage = content.homepage?.heroImage ?? "";
const phones = content.contact?.phones ?? [];
```

### Record<string, T> for Year-Keyed Data

The year-keyed collection structure uses TypeScript's `Record` type:
```typescript
bridal?: {
  years?: Record<string, CategoryYear>;
};
```

This allows any string as a year key while maintaining type safety on the value.

### String Literals as Discriminated Unions (instead of enums)

Status, branch, and dress type fields use string literal unions, not TypeScript enums:
```typescript
// From clients.ts
dressType: "wedding" | "evening" | "";
branch: "cairo" | "damietta" | "";
status: "active" | "completed" | "pending";
from: "atelier" | "admin";
```

In `atelier/page.tsx`, these are mapped to Arabic labels via plain objects:
```typescript
const statusAr = { active: "نشط", completed: "مكتمل", pending: "جديد" };
const dressTypeAr = { wedding: "زفاف", evening: "سهرة", "": "" };
```

### Error Handling in API Routes

All API route handlers wrap mutations in `try/catch`. The standard pattern:
```typescript
try {
  const client = await addClient({ ... });
  return NextResponse.json(client, { status: 201 });
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : "Failed to create client";
  return NextResponse.json({ error: msg }, { status: 400 });
}
```

Status codes used:
- `200` — successful GET/PUT/DELETE
- `201` — successful POST that creates a resource (new client)
- `400` — bad input (missing required field, invalid JSON, duplicate phone)
- `401` — missing or invalid `admin_session` cookie
- `404` — resource not found (client ID doesn't exist, year not found)
- `422` — semantic error (URL can't be fetched in `grab-url`)
- `500` — unexpected server error
- `503` — external dependency unavailable (Instagram session not found in `ig-video`)

### Undefined Filtering Before Spreading

The `updateClient` function demonstrates the pattern for safe partial updates:
```typescript
const cleanData = Object.fromEntries(
  Object.entries(data).filter(([, v]) => v !== undefined)
) as Partial<Omit<Client, "id" | "createdAt">>;
```

This prevents `undefined` values from overwriting existing fields when spreading.

---

## Server vs Client Component Decisions

### Server Components (default)
All page files (`page.tsx`) are server components unless marked with `"use client"`. Server components:
- Call `getContent()` directly (filesystem access)
- Render full page HTML including meta tags
- Pass content down to client components as props

```typescript
// src/app/layout.tsx — server component
export default async function RootLayout({ children }) {
  const content = await getContent();  // direct filesystem read
  return <html><body><Navbar content={content} />{children}</body></html>;
}
```

### Client Components
Marked with `"use client"` directive at the top of the file. Used when the component needs:
- Browser APIs (localStorage, MediaRecorder, canvas)
- Event handlers (`onClick`, `onChange`)
- React state (`useState`, `useEffect`, `useRef`)
- Router navigation (`useRouter`, `usePathname`)

Client components in this project:
- `Navbar.tsx` — needs scroll listener, router.push, useState for menu open
- `CollectionGrid.tsx` — drag-to-reorder requires event handlers and local state
- `ContactForm.tsx` — form submission with local state
- `LoadingScreen.tsx` — window.load event listener
- `RealBridesCarousel.tsx` — scroll behavior
- `src/app/admin/dashboard/page.tsx` — entire dashboard is a client component
- `src/app/atelier/page.tsx` — entire atelier is a client component

### The `"use client"` Boundary Rule
Server components can pass data to client components as props. They cannot:
- Import client components and call their functions
- Pass non-serializable objects (functions, class instances) as props

The `layout.tsx` passes `content: SiteContent` (a plain JSON object, fully serializable) to `Navbar` and `Footer`.

---

## Import Conventions

All non-relative imports use the `@/*` alias which maps to `./src/*`:
```typescript
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import CollectionGrid from "@/components/CollectionGrid";
```

Relative imports are only used within the same directory:
```typescript
// In app/experience/page.tsx
import TestimonialsSection from "./TestimonialsSection";
import VideosSection from "./VideosSection";
```

---

## Comments Policy

Comments are written only when the behavior is non-obvious or important for future maintainers. Examples from the codebase:

```typescript
// Convert relative /media/ paths to absolute URL (required by Next.js image optimizer)
// Skip PNG files — they are typically logos/icons with transparency.
// /_next/image converts them to AVIF/WebP/JPEG which can lose transparency
```

```typescript
// If phone was lost or is too short, reconstruct it from id so the record stays valid
// Public read — only returns fully-valid clients (has phone ≥7 digits)
// voiceNotes omitted — always initialized to [] on create
```

```typescript
// @ts-ignore — onload trick for async font loading without FOUT blocking
```

Avoid comments that restate what the code does. Write comments that explain why.

---

## Function Signatures and Async Patterns

Library functions (`src/lib/*.ts`) are `async` even when the underlying operation is synchronous (`fs.readFileSync`). This is a forward-compatibility pattern — if the storage layer ever changes to a true async source (database, S3), the API contract doesn't change.

```typescript
export async function getContent(): Promise<SiteContent> {
  // synchronous fs call inside async function
  return JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8"));
}
```

API route handlers are always `async`:
```typescript
export async function GET() { ... }
export async function POST(req: NextRequest) { ... }
```

---

## Omit<T, Keys> Pattern for Creation Functions

When creating new records, the `id` and `createdAt` fields are always computed at creation time, never accepted from the caller. Functions use `Omit<T, "id" | "createdAt">`:

```typescript
export async function addClient(
  data: Omit<Client, "id" | "createdAt" | "voiceNotes">
): Promise<Client>

export async function addVoiceNote(
  clientId: string,
  data: Omit<VoiceNote, "id" | "createdAt">
): Promise<Client | null>
```

IDs for sub-records (payments, dresses, voice notes) are generated with:
```typescript
id: Math.random().toString(36).substring(2, 11)
```

This is 9 characters of base-36, sufficient for the record counts expected in this application.
