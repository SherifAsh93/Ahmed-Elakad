import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AsyncFontStylesheet from "@/components/AsyncFontStylesheet";
import { getContent } from "@/lib/content";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    metadataBase: new URL("https://ahmedelakad.com"),
    title: {
      default: content.siteInfo?.brandName ?? "Ahmed Elakad Couture",
      template: `%s | ${content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}`,
    },
    description: content.siteInfo?.description ?? "Ahmed Elakad Couture — Luxury fashion design.",
    other: {
      "google": "notranslate",
      "facebook-domain-verification": "tqxbddfhc3nx52np7coh7e55gjwnwn",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();

  return (
    <html lang="en" translate="no">
      <head>
        {/* Preconnect to font + Cloudinary origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Meta Pixel */}
        <script dangerouslySetInnerHTML={{__html:`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1740830137346129');fbq('track','PageView');`}} />
        <noscript dangerouslySetInnerHTML={{__html:`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1740830137346129&ev=PageView&noscript=1"/>`}} />
        {/* Fonts loaded async via <link> instead of render-blocking CSS @import */}
        <AsyncFontStylesheet href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=Cinzel:wght@400;500&display=swap" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar content={content} />
        <div className="flex-1">
          {children}
        </div>
        <Footer content={content} />
      </body>
    </html>
  );
}
