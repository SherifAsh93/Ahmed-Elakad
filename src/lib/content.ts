import fs from "fs";
import path from "path";
import cloudinary, { CLOUDINARY_FOLDER } from "./cloudinary";

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
    metaTitle?: string;
    metaDescription?: string;
    title?: string;
    subtitle?: string;
    bio?: string[];
    portraitImage?: string;
    sideImage?: string;
  };
  collections?: Array<{
    slug: string;
    title: string;
    images: string[];
    category: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
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
 * Fetches site content.
 * In dev, it reads from src/data/content.json.
 * In production, it attempts to fetch from Cloudinary (raw file).
 */
export async function getContent(): Promise<SiteContent> {
  let localContent: SiteContent = {};
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, "utf-8");
      localContent = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading local content:", e);
  }

  // 1. Fetch Cloudinary content first with zero caching
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const folder = encodeURIComponent(CLOUDINARY_FOLDER);
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${folder}/content.json`;
      
      const res = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (res.ok) {
        const cloudContent = await res.json();
        if (cloudContent && Object.keys(cloudContent).length > 0) {
          // PRODUCTION: Cloudinary is the absolute source of truth
          if (process.env.NODE_ENV === "production") {
            return cloudContent;
          }
          // DEVELOPMENT: Prioritize local for instant save feedback
          return { ...cloudContent, ...localContent };
        }
      }
    } catch (e) {
      console.error("Cloudinary fetch error:", e);
    }
  }

  return localContent;
}



/**
 * Saves site content.
 * In dev, it writes to src/data/content.json.
 * It also uploads to Cloudinary for production persistence.
 */
export async function saveContent(content: SiteContent): Promise<void> {
    // 1. Save locally (only if not in production and fs is available)
    if (process.env.NODE_ENV !== "production") {
      try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
      } catch (e) {
        console.error("Error saving local content:", e);
      }
    }

    // 2. Upload to Cloudinary (Persistence for Production)
    if (process.env.CLOUDINARY_API_SECRET) {
      try {
        const contentStr = JSON.stringify(content);
        const base64 = Buffer.from(contentStr).toString("base64");
        await cloudinary.uploader.upload(`data:application/json;base64,${base64}`, {
          resource_type: "raw",
          public_id: CLOUDINARY_CONTENT_PATH,
          overwrite: true,
        });
      } catch (e) {
        console.error("Error saving to Cloudinary:", e);
        throw new Error("Failed to save to cloud storage.");
      }
    }
  }
