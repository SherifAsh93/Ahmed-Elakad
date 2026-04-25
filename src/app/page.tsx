import { getContent } from "@/lib/content";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const content = await getContent();
  const home = content.homepage ?? {};

  return (
    <main className="bg-white">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-screen min-h-[500px] overflow-hidden">
        <img 
          src={home.heroImage || "/images/1 (1).jpg"} 
          alt="Ahmed Elakad Home" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/5"></div>
        
        {/* Call to Actions */}
        <div className="absolute bottom-10 sm:bottom-16 inset-x-0 flex justify-center z-10 w-full px-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 w-full max-w-sm sm:max-w-none sm:w-auto">
            <Link 
              href="/collections/bridal-2026" 
              className="pill-btn pill-btn-beige py-3.5 px-8 text-[10px] tracking-[3px] sm:tracking-[4px] uppercase font-bold shadow-xl hover:scale-105 transition-all text-center"
            >
              Find Your Dress
            </Link>
            <Link 
              href="/the-label" 
              className="pill-btn pill-btn-white py-3.5 px-8 text-[10px] tracking-[3px] sm:tracking-[4px] uppercase font-bold shadow-xl hover:scale-105 transition-all text-center"
            >
              Shop The Label
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
