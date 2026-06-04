import fs from "fs";
import path from "path";
import { atomicWriteJSON } from "@/lib/atomicWrite";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  subtitle: string;
  rating?: number;
}

export interface VideoItem {
  id: string;
  url: string;
  title?: string;
  clientName?: string;
  clientSubtitle?: string;
}

export interface Collection {
  id: string;
  name?: string;
  images: string[];
}

export interface CategoryYear {
  collections: Collection[];
}

export interface SiteContent {
  siteInfo?: {
    brandName?: string;
    labelName?: string;
    description?: string;
    logo?: string;
  };
  homepage?: {
    // Hero section
    heroImage?: string;
    heroLabel?: string;
    heroHeading?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    heroCTAText?: string;
    heroCTAHref?: string;
    // Collections section
    collection1Image?: string;
    collection1Label?: string;
    collection1Href?: string;
    collection2Image?: string;
    collection2Label?: string;
    collection2Href?: string;
    collection3Image?: string;
    collection3Label?: string;
    collection3Href?: string;
    // House of Ahmed Elakad section
    houseImage?: string;
    houseBio?: string[];
    // Real Brides gallery
    featuredImages?: string[];
    // Bridal Journey CTA
    ctaImage?: string;
    ctaHeading?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonHref?: string;
    // SEO
    metaTitle?: string;
    metaDescription?: string;
    // Legacy (kept for compatibility)
    cta1Text?: string;
    cta1Href?: string;
    cta2Text?: string;
    cta2Href?: string;
  };
  about?: {
    title?: string;
    subtitle?: string;
    tagline?: string;
    bio?: string[];
    portraitImage?: string;
    sideImage?: string;
    gallery?: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  bridal?: {
    bannerImage?: string;
    gallery?: string[];
    years?: Record<string, CategoryYear>;
  };
  couture?: {
    bannerImage?: string;
    gallery?: string[];
    years?: Record<string, CategoryYear>;
  };
  theLabelPage?: {
    metaTitle?: string;
    metaDescription?: string;
    heroImage?: string;
    gallery?: string[];
  };
  contact?: {
    pageTitle?: string;
    pageSubtitle?: string;
    phones?: string[];
    email?: string;
    location?: string;
    heroImage?: string;
    internationalTitle?: string;
    internationalText?: string;
    internationalImage?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  experience?: {
    heroImage?: string;
    heroSubheading?: string;
    heroHeading?: string;
    heroDescriptions?: string[];
    kindWordsTitle?: string;
    kindWordsIntro?: string;
    testimonials?: Testimonial[];
    videoSectionTitle?: string;
    videoSectionSubtitle?: string;
    videos?: VideoItem[];
    ctaImage?: string;
    ctaHeading?: string;
    ctaSubtitle?: string;
    ctaText?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  social?: {
    pinterest?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    threads?: string;
    tiktok?: string;
  };
  footer?: {
    copyright?: string;
    creditText?: string;
    creditLink?: string;
  };
}

const CONTENT_FILE = "/home/sherif/data/ahmed-elakad/content.json";

export async function getContent(): Promise<SiteContent> {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8"));
      if (parsed && Object.keys(parsed).length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading content.json:", e);
  }
  return {};
}

export async function saveContent(content: SiteContent): Promise<void> {
  try {
    atomicWriteJSON(CONTENT_FILE, content);
  } catch (e) {
    console.error("Error saving content.json:", e);
    throw new Error("Failed to write content file.");
  }
}
