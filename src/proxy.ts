import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COMING_SOON_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Ahmed El Akad Couture — Coming Soon</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Cinzel:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: #0d0d0d;
    color: #f9f7f4;
    font-family: "Cormorant Garamond", Georgia, serif;
  }
  body {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6vh 6vw;
    text-align: center;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(179,163,132,0.10), transparent 60%),
      #0d0d0d;
  }
  main { max-width: 640px; }
  .brand {
    font-family: "Cinzel", serif;
    font-size: clamp(1.1rem, 2.4vw, 1.6rem);
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #b3a384;
    margin: 0 0 2.5rem;
  }
  .rule {
    width: 64px;
    height: 1px;
    background: #b3a384;
    margin: 0 auto 2.5rem;
    opacity: 0.6;
  }
  h1 {
    font-weight: 300;
    font-size: clamp(2.25rem, 6vw, 3.75rem);
    letter-spacing: 0.06em;
    margin: 0 0 1.25rem;
    color: #f9f7f4;
  }
  p {
    font-size: clamp(1rem, 1.6vw, 1.15rem);
    line-height: 1.7;
    color: #cfc9c0;
    font-weight: 300;
    margin: 0 auto;
    max-width: 460px;
  }
  .foot {
    margin-top: 3rem;
    font-family: "Cinzel", serif;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7d7d7d;
  }
</style>
</head>
<body>
  <main>
    <p class="brand">Ahmed El Akad Couture</p>
    <div class="rule"></div>
    <h1>Coming&nbsp;Soon</h1>
    <p>We're refreshing our latest collections. Please check back shortly &mdash; we'll be back with our newest pieces soon.</p>
    <p class="foot">Ahmed El Akad</p>
  </main>
</body>
</html>`;

export function proxy(request: NextRequest) {
  const isAdmin = request.cookies.get("admin_session")?.value === "authenticated";
  if (isAdmin) return NextResponse.next();

  return new NextResponse(COMING_SOON_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Retry-After": "86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

// Note: unlike the original version of this lock, "media" is intentionally
// NOT excluded here — public/media/ holds unlinked legacy uploads (old
// client photos) that must stay behind the admin session, not just the
// rest of the public site.
export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|opengraph-image.png|twitter-image.png|robots.txt|sitemap.xml|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
