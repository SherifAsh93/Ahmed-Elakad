# UI Patterns — Ahmed Elakad Couture House

## Design System — CSS Variables

Defined in `src/app/globals.css` on `:root`:

```css
:root {
  --primary-gold: #b3a384;    /* The brand accent: warm muted gold. Used for borders, buttons, highlights */
  --bg-light: #f9f7f4;        /* Off-white page background (cream/linen tone) */
  --text-gray: #7d7d7d;       /* Secondary text, captions, nav links */
  --text-black: #1a1a1a;      /* Primary body text (not pure black, avoids harshness) */
  --border-light: #eeeeee;    /* Dividers, card borders, header borders */
  --white: #ffffff;           /* Pure white for cards, inputs */

  --font-serif: "Cormorant Garamond", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Cinzel", serif;
}
```

**Body background** is `#0d0d0d` (near-black), set on `body` in `globals.css`. Pages set their own background via Tailwind classes (e.g., `bg-[#f9f7f4]` on `<main>`). This creates the editorial effect where the dark background shows between page sections on some views.

---

## Typography System

### Fonts

| Variable | Font | Weights Loaded | Role |
|---|---|---|---|
| `--font-display` | Cinzel | 400, 500 | Section headings, brand name, collection titles. All-caps serif with high contrast strokes. |
| `--font-serif` | Cormorant Garamond | 300, 400, 500, 600 (italic variants too) | Body text, quotes, editorial paragraphs. Elegant, thin, magazine-style. |
| `--font-sans` | Inter | 300, 400, 500, 600 | UI elements, nav links, labels, admin interfaces. |

### Font Loading Strategy

Fonts are loaded **asynchronously without render blocking** using the `media="print"` trick in `src/app/layout.tsx`:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@...&family=Inter:...&family=Cinzel:...&display=swap"
  media="print"
  onLoad="this.media='all'"
/>
```

The browser treats `media="print"` stylesheets as low-priority (non-render-blocking). The `onLoad` handler switches it to `media="all"` after download, applying the fonts. There is also `@ts-ignore` on the `onLoad` attribute because TypeScript doesn't know about this pattern.

Preconnect headers are set for both `fonts.googleapis.com` and `fonts.gstatic.com`.

### Font CSS Classes

Two utility classes are defined in `globals.css` and used with Tailwind:
```css
.font-serif  { font-family: var(--font-serif); }
.font-display { font-family: var(--font-display); }
```

The default `body` font is `var(--font-sans)` (Inter).

### Responsive Text Scaling Pattern

Text sizes are set with `sm:` breakpoint variants following a mobile-first pattern. Common examples from the codebase:

```
text-[11px] sm:text-[13px]       — brand name in Navbar
text-[10px] sm:text-[11px]       — nav links
text-[9px] sm:text-[10px]        — pill button text
text-4xl sm:text-5xl md:text-7xl — hero headings
text-3xl sm:text-4xl md:text-5xl — page headings
```

---

## Color Palette (Full)

| Color | Hex | Where Used |
|---|---|---|
| Primary gold | `#b3a384` | Brand accent, focus borders, progress bars, buttons |
| Gold transparent | `rgba(179, 163, 132, 0.65)` | Pill button beige variant |
| Dark background | `#0d0d0d` | Body background, navbar background |
| Navbar dark | `#0d0d0d/96` | Scrolled navbar (96% opacity) |
| Page background | `#f9f7f4` | All public pages |
| Atelier root | `#faf9f7` | Atelier CRM background |
| Mobile menu | `#f5f2ee` | Mobile navigation overlay |
| Text primary | `#1a1a1a` | All body text |
| Text muted | `#7d7d7d` | Secondary labels |
| Nav link color | `#a49a8b` | Desktop nav links (hover → `#1a1a1a`) |
| White overlay | `rgba(0, 0, 0, 0.35)` | Hero image darkening overlay |
| Gold divider | `#b3a384` | The `.gold-divider` 40×1px horizontal rule |
| WhatsApp green | `#25D366` | WhatsApp link button in Atelier |

---

## Animation System

All animations defined as `@keyframes` in `globals.css`:

### `subtle-zoom` — Hero Image Ken Burns Effect
```css
@keyframes subtle-zoom {
  from { transform: scale(1.05); }
  to   { transform: scale(1.15); }
}
.animate-subtle-zoom {
  animation: subtle-zoom 20s ease-in-out infinite alternate;
}
```
Used on the homepage hero image. Slow 20-second zoom creates a cinematic, living feel. `infinite alternate` makes it breathe (zoom in, then back out).

### `nudge-x` — Right Arrow Bounce
```css
@keyframes nudge-x {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(5px); }
}
.animate-nudge-x {
  animation: nudge-x 1.1s ease-in-out infinite;
}
```
Used on right-pointing CTA arrows to hint at clickability.

### `nudge-x-left` — Left Arrow Bounce
```css
@keyframes nudge-x-left {
  0%, 100% { transform: translateX(0); }
  50%       { transform: translateX(-5px); }
}
.animate-nudge-left {
  animation: nudge-x-left 1.1s ease-in-out infinite;
}
```
Mirror of `nudge-x`, used on left-pointing nav arrows.

### Tailwind Transition Utilities
Used inline on interactive elements:
- `transition-all duration-500` — navbar background transition on scroll
- `transition-all duration-300` — button hover effects
- `transition-colors` — link hover colors
- `transition-transform active:scale-95` — voice recorder button tap feedback

---

## Responsive System

### Breakpoints (Tailwind Defaults, Used in This Project)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Additional custom breakpoints in `globals.css` masonry grid:
- `1600px`: 5 columns
- `2000px`: 6 columns

### Mobile-First Pattern
All responsive classes start from mobile and add `sm:`, `md:`, `lg:` overrides:
```html
<!-- Navbar height -->
<div class="h-[60px] sm:h-[68px]">

<!-- Container padding -->
<div class="px-5 sm:px-10 md:px-16">

<!-- Hero heading -->
<h1 class="text-4xl sm:text-5xl md:text-7xl">
```

---

## Layout Primitives

### `.container-custom` (from globals.css)
```css
.container-custom {
  max-width: 1440px;
  margin: 0 auto;
  padding-left: 1.25rem;   /* 20px mobile */
  padding-right: 1.25rem;
}
@media (min-width: 640px) { padding: 1.5rem; }   /* 24px */
@media (min-width: 768px) { padding: 2.5rem; }   /* 40px */
```

### `.container-xl` (from globals.css)
Same max-width but different padding:
```css
.container-xl {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 16px;
}
@media (min-width: 768px) { padding: 0 40px; }
```

### `.section-pad` (from globals.css)
Standard vertical section spacing:
```css
.section-pad { padding: 48px 0; }
@media (min-width: 768px) { padding: 80px 0; }
```

### `.page-hero` (from globals.css)
Standard page header with image:
```css
.page-hero {
  height: 50vh; min-height: 280px;
  padding-top: 120px;
}
@media (min-width: 768px) { height: 60vh; min-height: 400px; padding-top: 200px; }
```

### Masonry Grid (`.masonry-grid` from globals.css)
CSS column-based masonry layout:
```css
.masonry-grid { columns: 2; column-gap: 8px; }
@media (min-width: 640px) { column-gap: 12px; }
@media (min-width: 768px) { columns: 3; column-gap: 15px; }
@media (min-width: 1024px) { columns: 4; }
@media (min-width: 1600px) { columns: 5; }
@media (min-width: 2000px) { columns: 6; }
```

Items use `break-inside: avoid` with `.masonry-item` class.

---

## Component Patterns

### Navbar — Triple-Tap Secret Admin Entry
`src/components/Navbar.tsx` uses a ref-based tap counter:
```typescript
const logoTaps = useRef(0);
const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleLogoClick(e: React.MouseEvent) {
  logoTaps.current += 1;
  if (logoTimer.current) clearTimeout(logoTimer.current);
  if (logoTaps.current >= 3) {
    e.preventDefault();
    logoTaps.current = 0;
    router.push("/admin");
    return;
  }
  logoTimer.current = setTimeout(() => { logoTaps.current = 0; }, 600);
}
```

Three taps within 600ms of each other triggers navigation to `/admin`. The timer resets the counter if the 600ms window expires.

**Navbar Transparency:** On the homepage only (`pathname === "/"`), the navbar is transparent when the user hasn't scrolled:
```typescript
const transparent = isHome && !isScrolled && !isOpen;
// transparent → "bg-gradient-to-b from-black/50 to-transparent"
// scrolled   → "bg-[#0d0d0d]/96 backdrop-blur-sm"
```

**Admin Suppression:** The Navbar returns `null` for any route starting with `/admin`:
```typescript
if (pathname.startsWith("/admin")) return null;
```

**Mobile Menu:** Full-screen overlay (`position: fixed; inset: 0`) with `bg-[#f5f2ee]`. Body scroll is locked via `document.body.style.overflow = isOpen ? "hidden" : ""`.

### Lightbox Pattern
Used in `MasonryGallery.tsx` and inline in `atelier/page.tsx`. Pattern:
```typescript
const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

// On image click:
<img onClick={() => setLightboxSrc(src)} />

// Lightbox overlay:
{lightboxSrc && (
  <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
    <img src={lightboxSrc} className="lightbox-img" onClick={e => e.stopPropagation()} />
  </div>
)}
```

The `.lightbox-overlay` CSS class:
```css
.lightbox-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
}
.lightbox-img {
  max-width: 95vw; max-height: 90vh;
  object-fit: contain;
}
```

### Snap-Scroll Carousel (`RealBridesCarousel.tsx`)
Horizontal scroll container with CSS snap:
```html
<div class="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3">
  <div class="snap-start shrink-0 ...">image</div>
</div>
```

`.scrollbar-none` hides the scrollbar cross-browser:
```css
.scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
```

### Admin Input / Card Utilities
```css
.admin-card { background: white; border: 1px solid #eee; padding: 16px; border-radius: 4px; }
.admin-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; margin-top: 5px; }
.admin-input:focus { border-color: var(--primary-gold); }
```

### Gold Divider
```css
.gold-divider { width: 40px; height: 1px; background: #b3a384; margin: 0 auto; }
```

Used as a visual separator between sections in page layouts.

### Pill Buttons
```css
.pill-btn {
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.pill-btn-beige { background: rgba(179, 163, 132, 0.65); color: white; }
.pill-btn-white { background: white; color: #1a1a1a; }
```

Used for hero CTA buttons. Hover effect adds `translateY(-2px)`.
