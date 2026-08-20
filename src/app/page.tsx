export default function HomePage() {
  return (
    <main className="bg-[#f5f2ee] min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto py-24">
        <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] mb-3">Ahmed Elakad Couture</p>
        <h1 className="font-serif font-light text-[#1a1a1a] leading-tight mb-4 text-[28px] sm:text-[36px] md:text-[44px]">
          We&apos;ll Be Back<br />Shortly
        </h1>
        <div className="w-8 h-px bg-[#b3a384] mx-auto mb-5" />
        <p className="text-[11px] sm:text-[12px] text-[#5a5a5a] leading-relaxed font-light mb-8">
          Our atelier is currently undergoing scheduled updates. We&apos;re working
          to bring you an even better experience and will be back online soon.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 text-[8px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/20 pb-1 hover:border-[#b3a384]"
        >
          Contact Us
        </a>
      </div>
    </main>
  );
}
