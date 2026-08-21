import { adEnquiries as adEnquiriesTable } from "@/lib/db/schema";
import { getCollection, saveCollection } from "@/lib/db/store";

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
}

export async function getAdEnquiries(): Promise<AdEnquiry[]> {
  try {
    const all = await getCollection<AdEnquiry>(adEnquiriesTable);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveAdEnquiries(data: AdEnquiry[]): Promise<void> {
  await saveCollection(adEnquiriesTable, data);
}

export async function addAdEnquiry(data: Omit<AdEnquiry, "id" | "createdAt">): Promise<AdEnquiry> {
  const all = await getAdEnquiries();
  const entry: AdEnquiry = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };
  await saveAdEnquiries([entry, ...all]);
  return entry;
}
