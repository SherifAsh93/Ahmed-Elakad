import fs from "fs";
import path from "path";
import { atomicWriteJSON } from "@/lib/atomicWrite";

export interface AdEnquiry {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string;
  category: "bridal" | "evening";
  eventDate: string;
  silhouette: string;
  designDetails: string;
  investmentTier: string;
}

const FILE = "/home/sherif/data/ahmed-elakad/ad-enquiries.json";

function ensureDir() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getAdEnquiries(): AdEnquiry[] {
  ensureDir();
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function addAdEnquiry(data: Omit<AdEnquiry, "id" | "createdAt">): AdEnquiry {
  const all = getAdEnquiries();
  const entry: AdEnquiry = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };
  all.unshift(entry);
  ensureDir();
  atomicWriteJSON(FILE, all);
  return entry;
}
