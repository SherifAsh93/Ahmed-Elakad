import fs from "fs";
import path from "path";
import cloudinary, { CLOUDINARY_FOLDER } from "./cloudinary";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

const MESSAGES_FILE = path.join(process.cwd(), "src", "data", "messages.json");
const CLOUDINARY_MESSAGES_PATH = `${CLOUDINARY_FOLDER}/messages.json`;

/**
 * Fetches all contact messages.
 */
export async function getMessages(): Promise<ContactMessage[]> {
  let localMessages: ContactMessage[] = [];
  
  // Try local first (dev)
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
      localMessages = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading local messages:", e);
  }

  // Try Cloudinary (production or sync)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const folder = encodeURIComponent(CLOUDINARY_FOLDER);
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${folder}/messages.json`;
      
      const res = await fetch(url, {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (res.ok) {
        const cloudMessages = await res.json();
        if (Array.isArray(cloudMessages)) {
          // In production, Cloudinary is source of truth
          if (process.env.NODE_ENV === "production") {
            return cloudMessages;
          }
          // In dev, we might have more locally, but let's just use local if available
          return localMessages.length > 0 ? localMessages : cloudMessages;
        }
      }
    } catch (e) {
      console.error("Cloudinary messages fetch error:", e);
    }
  }

  return localMessages;
}

/**
 * Saves a new message.
 */
export async function addMessage(message: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  const messages = await getMessages();
  
  const newMessage: ContactMessage = {
    ...message,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
  };

  const updatedMessages = [newMessage, ...messages]; // Newest first

  // 1. Save locally
  if (process.env.NODE_ENV !== "production") {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(MESSAGES_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(updatedMessages, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving local messages:", e);
    }
  }

  // 2. Upload to Cloudinary
  if (process.env.CLOUDINARY_API_SECRET) {
    try {
      const contentStr = JSON.stringify(updatedMessages);
      const base64 = Buffer.from(contentStr).toString("base64");
      await cloudinary.uploader.upload(`data:application/json;base64,${base64}`, {
        resource_type: "raw",
        public_id: CLOUDINARY_MESSAGES_PATH,
        overwrite: true,
      });
    } catch (e) {
      console.error("Error saving messages to Cloudinary:", e);
      // Even if cloud fails, we return the message if local worked
    }
  }

  return newMessage;
}
