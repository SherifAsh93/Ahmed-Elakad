import { getContent } from "@/lib/content";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { optimizeImage } from "@/lib/utils";
import MasonryGallery from "@/components/MasonryGallery";

export default async function HomePage() {
  const content = await getContent();
  const home = content.homepage ?? {};

  return (
    <main className="bg-white">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-screen min-h-[500px] overflow-hidden">
        <img
          src={optimizeImage(home.heroImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg")}
          alt="Ahmed Elakad Home"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/5"></div>

        {/* Call to Actions */}
        <div className="absolute bottom-10 sm:bottom-16 inset-x-0 flex justify-center z-10 w-full px-6">
          <div className="hero-btn-wrap w-full max-w-sm sm:max-w-none sm:w-auto">
            <Link
              href={home.cta1Href || "/bridal"}
              className="pill-btn pill-btn-beige"
            >
              {home.cta1Text || "Find Your Dress"}
            </Link>
            <Link
              href={home.cta2Href || "/contact"}
              className="pill-btn pill-btn-white"
            >
              {home.cta2Text || "Book an Appointment"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
