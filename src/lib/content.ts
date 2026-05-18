import fs from "fs";
import path from "path";

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
    heroImage?: string;
    featuredImages?: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  about?: {
    title?: string;
    subtitle?: string;
    bio?: string[];
    portraitImage?: string;
    sideImage?: string;
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
    metaTitle?: string;
    metaDescription?: string;
  };
  social?: {
    pinterest?: string;
    facebook?: string;
    whatsapp?: string;
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
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving content.json:", e);
    throw new Error("Failed to write content file.");
  }
}
