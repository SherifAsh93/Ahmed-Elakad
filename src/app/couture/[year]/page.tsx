import { getContent } from "@/lib/content";
import CollectionGrid from "@/components/CollectionGrid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { optimizeImage } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALL_YEARS = ["2026","2025","2024","2023","2022","2021","2020","2019","2018","2017","2016"];

export default async function CoutureYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const content = await getContent();
  const years = content.couture?.years ?? {};
  const bannerImage = content.couture?.bannerImage ?? "";

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
    <main className="bg-white">
      {/* Hero Banner */}
      {bannerImage ? (
        <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh] overflow-hidden">
          <img
            src={optimizeImage(bannerImage)}
            alt="Couture Collection"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-[0.25em] text-white text-center drop-shadow-2xl">
              COUTURE
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
              COUTURE
            </h1>
            <p className="text-[10px] tracking-[5px] uppercase text-[#aaa] font-medium">
              Our Previous Designs
            </p>
          </div>
        </div>
      )}

      {/* Year tabs + content */}
      <div className="bg-white">
        <div className="pt-10 sm:pt-12 pb-8 text-center">
          {/* Year tabs */}
          <div className="overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-[5px] px-4 sm:px-0 min-w-max sm:min-w-0 sm:justify-center sm:flex-wrap mx-auto pb-1">
              {/* ALL tab */}
              <Link
                href="/couture/all"
                className={`px-4 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap ${
                  year === "all"
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-[#e7e7e7] text-[#1a1a1a] hover:bg-[#d0d0d0]"
                }`}
              >
                All
              </Link>
              {ALL_YEARS.map((y) => (
                <Link
                  key={y}
                  href={`/couture/${y}`}
                  className={`px-4 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap ${
                    y === year
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-[#e7e7e7] text-[#1a1a1a] hover:bg-[#d0d0d0]"
                  }`}
                >
                  {y}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 w-16 h-px bg-[#e8e0d5] mx-auto" />
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
                      <div className="flex-1 h-px bg-[#e8e0d5]" />
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
