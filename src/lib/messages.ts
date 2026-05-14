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
  read?: boolean;
}

const MESSAGES_FILE = path.join(process.cwd(), "src", "data", "messages.json");
const CLOUDINARY_MESSAGES_PATH = `${CLOUDINARY_FOLDER}/messages.json`;

function readLocal(): ContactMessage[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function writeLocal(messages: ContactMessage[]): void {
  const dir = path.dirname(MESSAGES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

async function backupToCloudinary(messages: ContactMessage[]): Promise<void> {
  if (!process.env.CLOUDINARY_API_SECRET) return;
  try {
    const base64 = Buffer.from(JSON.stringify(messages)).toString("base64");
    await cloudinary.uploader.upload(`data:application/json;base64,${base64}`, {
      resource_type: "raw",
      public_id: CLOUDINARY_MESSAGES_PATH,
      overwrite: true,
    });
  } catch (e) {
    console.error("Cloudinary messages backup failed:", e);
  }
}

export async function getMessages(): Promise<ContactMessage[]> {
  // Primary: local file (instant, no CDN cache)
  const local = readLocal();
  if (local.length > 0) return local;

  // Fallback: Cloudinary (first boot or missing file)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${encodeURIComponent(CLOUDINARY_FOLDER)}/messages.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const cloud = await res.json();
        if (Array.isArray(cloud) && cloud.length > 0) {
          writeLocal(cloud);
          return cloud;
        }
      }
    } catch (e) {
      console.error("Cloudinary messages fetch error:", e);
    }
  }

  return [];
}

export async function addMessage(msg: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  const messages = readLocal();
  const newMsg: ContactMessage = {
    ...msg,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const updated = [newMsg, ...messages];
  writeLocal(updated);
  void backupToCloudinary(updated);
  return newMsg;
}

export async function deleteMessage(id: string): Promise<void> {
  const messages = readLocal();
  const updated = messages.filter((m) => m.id !== id);
  writeLocal(updated);
  void backupToCloudinary(updated);
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  const messages = readLocal();
  const updated = messages.map((m) => (m.id === id ? { ...m, read } : m));
  writeLocal(updated);
  void backupToCloudinary(updated);
}
