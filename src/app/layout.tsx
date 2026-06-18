import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    other: { "google": "notranslate" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();

  return (
    <html lang="en" translate="no">
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
