import fs from "fs";
import path from "path";
import cloudinary, { CLOUDINARY_FOLDER } from "./cloudinary";

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

const CONTENT_FILE = path.join(process.cwd(), "src", "data", "content.json");
const CLOUDINARY_CONTENT_PATH = `${CLOUDINARY_FOLDER}/content.json`;

/**
 * Reads content from local file (primary) with Cloudinary as fallback.
 * Local file is always the source of truth on this VPS — no CDN caching issues.
 */
export async function getContent(): Promise<SiteContent> {
  // Primary: local file (instant, no CDN cache)
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading local content:", e);
  }

  // Fallback: Cloudinary (e.g. first boot, file missing)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const folder = encodeURIComponent(CLOUDINARY_FOLDER);
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${folder}/content.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const cloudContent = await res.json();
        if (cloudContent && Object.keys(cloudContent).length > 0) {
          // Persist to local so next read is fast
          try { fs.writeFileSync(CONTENT_FILE, JSON.stringify(cloudContent, null, 2), "utf-8"); } catch {}
          return cloudContent;
        }
      }
    } catch (e) {
      console.error("Cloudinary fetch error:", e);
    }
  }

  return {};
}

/**
 * Saves content to local file (immediate) and uploads to Cloudinary (backup).
 */
export async function saveContent(content: SiteContent): Promise<void> {
  // 1. Always write locally — VPS filesystem is persistent
  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving local content:", e);
    throw new Error("Failed to write local content file.");
  }

  // 2. Upload to Cloudinary as backup
  if (process.env.CLOUDINARY_API_SECRET) {
    try {
      const base64 = Buffer.from(JSON.stringify(content)).toString("base64");
      await cloudinary.uploader.upload(`data:application/json;base64,${base64}`, {
        resource_type: "raw",
        public_id: CLOUDINARY_CONTENT_PATH,
        overwrite: true,
      });
    } catch (e) {
      console.error("Cloudinary backup failed:", e);
      // Don't throw — local save already succeeded
    }
  }
}
