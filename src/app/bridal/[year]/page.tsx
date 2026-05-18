import { getContent } from "@/lib/content";
import CollectionGrid from "@/components/CollectionGrid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { optimizeImage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALL_YEARS = ["2026","2025","2024","2023","2022","2021","2020","2019","2018","2017","2016"];

export default async function BridalYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const content = await getContent();
  const years = content.bridal?.years ?? {};
  const bannerImage = content.bridal?.bannerImage ?? "";

  if (year !== "all" && !ALL_YEARS.includes(year)) notFound();

  // Build grouped data for "all" view
  const allYearGroups = year === "all"
    ? ALL_YEARS
        .filter((y) => y in years && (years[y].collections ?? []).some((c) => c.images.length > 0))
        .map((y) => ({
          year: y,
          collections: (years[y].collections ?? []).filter((c) => c.images.length > 0),
        }))
    : null;

  // Single year collections
  const collections = year !== "all" ? (years[year]?.collections ?? []) : [];

  return (
    <main className="bg-[#f9f7f4]">
      {/* Hero Banner */}
      {bannerImage ? (
        <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh] overflow-hidden">
          <img
            src={optimizeImage(bannerImage)}
            alt="Bridal Collection"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-[0.25em] text-white text-center drop-shadow-2xl">
              BRIDAL
            </h1>
            <p className="text-[10px] sm:text-[11px] tracking-[5px] sm:tracking-[8px] uppercase text-white/70 font-medium">
              Our Previous Designs
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-24 sm:pt-32 md:pt-[180px] bg-[#faf9f7]">
          <div className="py-12 sm:py-16 text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#1a1a1a] leading-none mb-3">
              BRIDAL
            </h1>
            <p className="text-[10px] tracking-[5px] uppercase text-[#aaa] font-medium">
              Our Previous Designs
            </p>
          </div>
        </div>
      )}

      {/* Year tabs + content */}
      <div className="bg-[#f9f7f4]">
        <div className="pt-10 sm:pt-12 pb-8 text-center">
          {/* Year tabs */}
          <div className="overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1 px-4 sm:px-0 min-w-max sm:min-w-0 sm:justify-center sm:flex-wrap mx-auto">
              <Link
                href="/bridal/all"
                className={`px-4 py-2.5 text-[10px] tracking-[2px] uppercase font-medium transition-all whitespace-nowrap border-b-2 ${
                  year === "all"
                    ? "border-[#b3a384] text-[#1a1a1a]"
                    : "border-transparent text-[#aaa] hover:text-[#555]"
                }`}
              >
                All
              </Link>
              {ALL_YEARS.map((y) => (
                <Link
                  key={y}
                  href={`/bridal/${y}`}
                  className={`px-4 py-2.5 text-[10px] tracking-[2px] uppercase font-medium transition-all whitespace-nowrap border-b-2 ${
                    y === year
                      ? "border-[#b3a384] text-[#1a1a1a]"
                      : "border-transparent text-[#aaa] hover:text-[#555]"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 w-12 h-px bg-[#b3a384]/40 mx-auto" />
        </div>

        {/* Content */}
        {year === "all" ? (
          /* All years grouped */
          <div className="pb-20 space-y-16">
            {allYearGroups && allYearGroups.length > 0 ? (
              allYearGroups.map(({ year: y, collections: colls }) => (
                <section key={y}>
                  <div className="px-4 sm:px-8 md:px-12 max-w-screen-xl mx-auto mb-8">
                    <div className="flex items-center gap-4">
                      <h2 className="font-display text-xl sm:text-2xl uppercase tracking-[0.2em] text-[#1a1a1a]">
                        {y}
                      </h2>
                      <div className="flex-1 h-px bg-[#e0dbd4]" />
                    </div>
                  </div>
                  <div className="px-4 sm:px-8 md:px-12 max-w-screen-xl mx-auto">
                    <CollectionGrid collections={colls} />
                  </div>
                </section>
              ))
            ) : (
              <div className="flex items-center justify-center py-28 text-center px-4">
                <p className="font-display text-2xl uppercase tracking-[0.15em] text-[#b3a384]">
                  Coming Soon
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Single year */
          <div className="px-4 sm:px-8 md:px-12 pb-20 max-w-screen-xl mx-auto">
            <CollectionGrid collections={collections} />
          </div>
        )}
      </div>
    </main>
  );
}
