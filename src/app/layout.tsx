import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getContent } from "@/lib/content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    title: {
      default: content.siteInfo?.brandName ?? "Ahmed Elakad Couture",
      template: `%s | ${content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}`,
    },
    description: content.siteInfo?.description ?? "Ahmed Elakad Couture — Luxury fashion design.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();

  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar content={content} />
        <div>
          {children}
        </div>
        <Footer content={content} />
      </body>
    </html>
  );
}
