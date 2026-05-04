import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default async function AboutPage() {
  const content = await getContent();
  const about = content.about ?? {};
  const bio: string[] = about.bio ?? [];
  
  // The first paragraph will go in the white box.
  const firstParagraph = bio.length > 0 ? bio[0] : "Ahmed Elakad Couture is a luxury fashion house specializing in bridal and couture wear.";
  // The rest will go below.
  const remainingBio = bio.length > 1 ? bio.slice(1) : [];

  return (
    <div className="bg-[#f9f7f4] min-h-screen flex flex-col">
      {/* Navbar spacer */}
      <div className="h-[80px] sm:h-[120px] w-full shrink-0 bg-white"></div>

      {/* Hero Image Section */}
      <div className="w-full bg-white relative pb-32">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-gray-100 relative">
            <img 
              src={optimizeImage(about.portraitImage ?? "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg")} 
              alt="About Us" 
              className="w-full h-full object-cover object-top" 
            />
          </div>
        </div>

        {/* Overlapping White Box */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[90%] max-w-[800px] bg-white p-8 sm:p-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)] z-10 border border-gray-50">
          <p className="text-[10px] tracking-[4px] sm:tracking-[6px] text-[#b3a384] uppercase font-medium mb-4">
            {about.subtitle ?? "The Designer"}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#1a1a1a] uppercase tracking-wider mb-6 sm:mb-10">
            {about.title ?? "ABOUT US"}
          </h1>
          <p className="text-[#555] leading-[2] text-sm sm:text-base font-light px-4 sm:px-12">
            {firstParagraph}
          </p>
        </div>
      </div>

      {/* Main Bio Section (Below white box) */}
      <div className="w-full pt-40 pb-24 sm:pt-48 sm:pb-32 px-4 sm:px-6">
        <div className="max-w-[700px] mx-auto space-y-8 sm:space-y-10 text-center">
          {remainingBio.map((para, i) => (
            <p key={i} className="text-[#333] leading-[2.2] text-base sm:text-lg font-light opacity-90">
              {para}
            </p>
          ))}
          {/* Optional: Add the side image at the bottom if it exists */}
          {about.sideImage && (
             <div className="pt-12 flex justify-center">
                <img 
                  src={optimizeImage(about.sideImage)} 
                  alt="Editorial Detail" 
                  className="max-w-[300px] h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" 
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
