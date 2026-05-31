# Ahmed Elakad Couture — Components Guide

## Overview

The project has 5 reusable React components in `src/components/`. All public-facing components receive the `SiteContent` type from `src/lib/content.ts` as a prop. Client-interactive components are marked `"use client"`.

---

## Navbar

**File:** `src/components/Navbar.tsx`  
**Type:** Client component (`"use client"`)

**Purpose:** Responsive site navigation bar with mobile hamburger menu and a hidden Easter egg link to the admin panel.

**Props:**
```typescript
interface NavbarProps {
  content: SiteContent; // Site content from content.json
}
```

**Features:**
- Displays brand name and logo from `content.siteInfo`
- Nav links: Bridal, Couture, About, Contact (with active state highlighting via `usePathname`)
- Mobile hamburger menu (toggle state with `useState`)
- Logo has a 3-tap Easter egg (tracked via `useRef`) that navigates to `/admin`
- Sticky at top of page

**Usage:**
```tsx
// Used in src/app/layout.tsx
import Navbar from "@/components/Navbar";
const content = await getContent();
<Navbar content={content} />
```

---

## Footer

**File:** `src/components/Footer.tsx`  
**Type:** Server component (no client interaction needed)

**Purpose:** Site footer displaying contact info and social media links.

**Props:**
```typescript
interface FooterProps {
  content: SiteContent;
}
```

**Features:**
- Brand name and tagline from `content.siteInfo`
- Social icons linking to Instagram, Facebook, WhatsApp (from `content.social`)
- Copyright text from `content.footer`
- Responsive centered layout

**Usage:**
```tsx
// Used in src/app/layout.tsx
import Footer from "@/components/Footer";
<Footer content={content} />
```

---

## MasonryGallery

**File:** `src/components/MasonryGallery.tsx`  
**Type:** Client component (`"use client"`)

**Purpose:** Responsive masonry-layout image gallery with a fullscreen lightbox viewer.

**Props:**
```typescript
interface MasonryGalleryProps {
  images: string[];     // Array of Cloudinary image URLs
}
```

**Features:**
- Responsive columns: 2 on mobile → 4 on desktop (CSS column-count)
- Lightbox on image click (covers full viewport)
- Keyboard navigation: Arrow Left/Right to navigate, Escape to close
- "Load More" button (shows 12 at a time)
- Click outside image to close lightbox

**Dependencies:**
- Uses `useEffect` for keyboard listener cleanup
- Uses `useState` for selected image index and visible count

**Usage:**
```tsx
import MasonryGallery from "@/components/MasonryGallery";

// Within a collection modal or gallery page
<MasonryGallery images={["https://res.cloudinary.com/...", ...]} />
```

---

## CollectionGrid

**File:** `src/components/CollectionGrid.tsx`  
**Type:** Client component (`"use client"`)

**Purpose:** Displays fashion collections as clickable cards. Clicking a card opens a modal with a full gallery of that collection's images.

**Props:**
```typescript
interface Collection {
  id: string;
  name: string;
  images: string[];   // Array of image URLs (first used as card thumbnail)
}

interface CollectionGridProps {
  collections: Collection[];
}
```

**Features:**
- Responsive grid: 1–5 columns based on number of collections and viewport
- Each card shows the collection name and first image as thumbnail
- Click opens a modal with a full `MasonryGallery` of all collection images
- Modal closes on Escape key press
- Adaptive centering when fewer collections than max columns

**Dependencies:**
- Internally uses `MasonryGallery` for the modal gallery
- `useState` for selected collection
- `useEffect` for Escape key listener

**Usage:**
```tsx
import CollectionGrid from "@/components/CollectionGrid";

// Bridal or Couture page
<CollectionGrid collections={content.bridal.years["2026"].collections} />
```

---

## ContactForm

**File:** `src/components/ContactForm.tsx`  
**Type:** Client component (`"use client"`)

**Purpose:** Contact and appointment booking form that submits to the `/api/contact` endpoint.

**Props:** None (standalone, uses internal API)

**Fields:**
- Name (required, text)
- Email (optional, email)
- Phone (optional, tel)
- Message (required, textarea)

**Features:**
- Controlled inputs with `useState`
- Loading state on submit (button disabled)
- Success message on successful submission
- Error message if submission fails
- Form resets after successful submission

**API Call:**
```typescript
// Submits to:
POST /api/contact
Content-Type: application/json
Body: { name, email, phone, message }
```

**Usage:**
```tsx
import ContactForm from "@/components/ContactForm";

// Used in src/app/contact/page.tsx
<ContactForm />
```

---

## Notes on the Admin Dashboard

The admin dashboard at `src/app/admin/dashboard/page.tsx` is a 143KB monolithic client component. It is NOT in the `components/` directory and is not reusable — it contains the full CMS UI for editing site content, managing images, viewing messages, and changing the admin password.

The Atelier CRM at `src/app/atelier/page.tsx` is similarly a large inline client component containing the entire client management interface (Arabic RTL).

These are intentionally monolithic to minimize prop-drilling complexity given the project's scale.
