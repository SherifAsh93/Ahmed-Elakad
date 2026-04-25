import { getContent } from "@/lib/content";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const content = await getContent();
  const home = content.homepage ?? {};

  return (
    <main className="bg-white">
      {/* ── Editorial Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
        <img 
          src={home.heroImage || "/images/1 (1).jpg"} 
          alt="Ahmed Elakad Home" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/5"></div>
        
        {/* Call to Actions - Positioned perfectly within the view */}
        <div className="absolute bottom-16 inset-x-0 flex justify-center z-10 w-full px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <Link 
              href="/collections/bridal-2026" 
              className="pill-btn pill-btn-beige py-3.5 px-10 text-[10px] tracking-[4px] uppercase font-bold shadow-xl hover:scale-105 transition-all w-full sm:min-w-[220px]"
            >
              Find Your Dress
            </Link>
            <Link 
              href="/the-label" 
              className="pill-btn pill-btn-white py-3.5 px-10 text-[10px] tracking-[4px] uppercase font-bold shadow-xl hover:scale-105 transition-all w-full sm:min-w-[220px]"
            >
              Shop The Label
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
