/* eslint-disable @next/next/no-img-element */
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import ContactForm from "@/components/ContactForm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContactPage() {
  const content = await getContent();
  const contact = content.contact ?? {};
  const phones: string[] = contact.phones ?? [];
  const heroImage = optimizeImage(contact.heroImage || "/images/1 (200).jpg");
  const whatsappNumber = content.social?.whatsapp || "201101548030";
  const waHref = "https://wa.me/" + whatsappNumber.replace(/\D/g, "");
  const waSvgPath = "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.8l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.7 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z";

  return (
    <main className="bg-[#e8e8e8] min-h-screen pt-16 md:pt-24 pb-10 md:pb-20">

      {/* ── MOBILE LAYOUT (< md) ── */}
      <div className="md:hidden flex flex-col">

        {/* Hero */}
        <div className="relative h-[240px] w-full">
          <img src={heroImage} alt="Contact Us" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/88 backdrop-blur-sm px-8 py-5 border border-stone-100 shadow-lg text-center">
              <h1 className="font-serif text-2xl uppercase tracking-[0.2em] text-stone-800 mb-1.5">
                Contact Us
              </h1>
              <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.3em] font-light text-stone-500">
                <a href="/">Home</a>
                <span>/</span>
                <span>Contact Us</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mx-4 mt-4 bg-white shadow-sm">
          <div className="px-5 pt-6 pb-4">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-2 leading-tight">
              Make An Appointment
            </h2>
            <p className="text-stone-500 font-light text-sm leading-relaxed">
              {contact.pageSubtitle || "Get in touch with us to reserve an appointment, for more info or inquiries. We are thrilled to safely welcome you to our atelier and look forward to seeing you soon!"}
            </p>
          </div>
          <div className="h-px w-full bg-stone-200" />
          <div className="px-5 divide-y divide-stone-200">
            <div className="py-3.5">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-1">Call Us</h3>
              {phones.length > 0 ? phones.map((p, i) => (
                <a key={i} href={"tel:" + p} className="block text-stone-700 text-sm font-light tracking-wide uppercase">{p}</a>
              )) : <p className="text-stone-700 text-sm font-light">Not available</p>}
            </div>
            <div className="py-3.5">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-1">Email</h3>
              <a href={"mailto:" + contact.email} className="block text-stone-700 text-sm font-light break-all tracking-wide uppercase">
                {contact.email || "info@ahmedelakad.com"}
              </a>
            </div>
            <div className="py-3.5">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-1">Text Us</h3>
              <a href={waHref} target="_blank" rel="noreferrer"
                className="inline-flex w-9 h-9 rounded-full border border-stone-200 items-center justify-center text-stone-500">
                <svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor"><path d={waSvgPath} /></svg>
              </a>
            </div>
            <div className="py-3.5">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-1">Our Atelier</h3>
              <p className="text-stone-700 text-sm font-light leading-relaxed tracking-wide uppercase">
                {contact.location || "Location details coming soon."}
              </p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="mx-4 mt-3 mb-6 bg-[#eeeeee] shadow-sm px-5 py-7">
          <ContactForm />
        </div>

      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ── */}
      <div className="hidden md:flex max-w-[1200px] mx-auto md:px-8 shadow-2xl overflow-hidden flex-row">

        {/* Column 1: Image */}
        <div className="w-[30%] relative border-r border-stone-100 bg-white">
          <img src={heroImage} alt="Contact Us" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white/90 backdrop-blur-md px-10 py-10 border border-stone-100 shadow-xl text-center">
              <h1 className="font-serif text-4xl uppercase tracking-[0.2em] text-stone-800 mb-3 whitespace-nowrap">
                Contact Us
              </h1>
              <div className="flex items-center justify-center gap-3 text-[9px] uppercase tracking-[0.3em] font-light text-stone-500">
                <a href="/" className="hover:text-[#b3a384] transition-colors">Home</a>
                <span>/</span>
                <span>Contact Us</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Info */}
        <div className="w-[35%] bg-white flex flex-col border-r border-stone-200">
          <div className="px-10 pt-10 pb-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4 leading-tight">
              Make An Appointment
            </h2>
            <p className="text-stone-500 font-light text-sm leading-relaxed">
              {contact.pageSubtitle || "Get in touch with us to reserve an appointment, for more info or inquiries. We are thrilled to safely welcome you to our atelier and look forward to seeing you soon!"}
            </p>
          </div>
          <div className="h-px w-full bg-stone-100" />
          <div className="px-10 divide-y divide-stone-100">
            <div className="py-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-2">Call Us</h3>
              {phones.length > 0 ? phones.map((p, i) => (
                <a key={i} href={"tel:" + p} className="block text-stone-700 hover:text-[#b3a384] transition-colors text-sm font-light tracking-wide uppercase">{p}</a>
              )) : <p className="text-stone-700 text-sm font-light">Not available</p>}
            </div>
            <div className="py-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-2">Email</h3>
              <a href={"mailto:" + contact.email} className="block text-stone-700 hover:text-[#b3a384] transition-colors text-sm font-light break-all tracking-wide uppercase">
                {contact.email || "info@ahmedelakad.com"}
              </a>
            </div>
            <div className="py-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-2">Text Us</h3>
              <a href={waHref} target="_blank" rel="noreferrer"
                className="inline-flex w-10 h-10 rounded-full border border-stone-200 items-center justify-center text-stone-500 hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 448 512" fill="currentColor"><path d={waSvgPath} /></svg>
              </a>
            </div>
            <div className="py-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-400 mb-2">Our Atelier</h3>
              <p className="text-stone-700 text-sm font-light leading-relaxed tracking-wide uppercase">
                {contact.location || "Location details coming soon."}
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Form */}
        <div className="w-[35%] bg-[#eeeeee] px-12 py-12 flex flex-col justify-center">
          <ContactForm />
        </div>

      </div>

    </main>
  );
}