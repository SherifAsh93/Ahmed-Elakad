import { getContent } from "@/lib/content";

export default async function AboutPage() {
  const content = await getContent();
  const about = content.about ?? {};
  const bio: string[] = about.bio ?? [];

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Spacer to clear the absolute Navbar (approx 200px height) */}
      <div className="h-[200px] w-full shrink-0"></div>

      {/* Centered Content Area */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container-custom max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Primary Portrait - Left */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start order-2 lg:order-1">
              <p className="mb-4 text-[10px] tracking-[5px] text-[#b3a384] uppercase font-bold">
                  {about.subtitle ?? "Ahmed Elakad"}
              </p>
              <div className="aspect-[3/4] w-full max-w-[360px] overflow-hidden bg-gray-50 shadow-2xl rounded-sm">
                <img 
                  src={about.portraitImage || "/ahmed.jpg"} 
                  alt="Ahmed Elakad" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            
            {/* Main Bio - Center */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <h1 className="font-display text-4xl lg:text-5xl text-[#1a1a1a] uppercase tracking-wider mb-8 leading-none">
                  {about.title ?? "The Designer"}
              </h1>
              
              <div className="space-y-6">
                {bio.map((para, i) => (
                  <p key={i} className="text-[#333] leading-[1.8] text-lg lg:text-xl font-light serif italic opacity-90">
                      {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Secondary Editorial - Right */}
            {about.sideImage && (
              <div className="lg:col-span-3 flex flex-col items-center order-3">
                 <div className="h-20 w-px bg-[#b3a384]/20 mb-8 hidden lg:block"></div>
                 <div className="aspect-[4/5] w-full max-w-[280px] overflow-hidden bg-gray-50 shadow-xl opacity-90 hover:opacity-100 transition-opacity rounded-sm">
                  <img 
                    src={about.sideImage} 
                    alt="Editorial Detail" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                 <p className="mt-4 text-[9px] tracking-[4px] text-[#b3a384]/60 uppercase text-center font-medium italic">Editorial Accent</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
