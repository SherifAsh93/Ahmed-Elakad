import { siteContent } from "@/lib/db/schema";
import { getSingleton, saveSingleton } from "@/lib/db/store";

const CONFIG_ID = "admin-config";

interface SiteConfig {
  adminPassword: string;
}

export async function getAdminPassword(): Promise<string> {
  const config = await getSingleton<SiteConfig>(siteContent, CONFIG_ID);
  return config?.adminPassword ?? process.env.ADMIN_PASSWORD ?? "1415";
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  await saveSingleton<SiteConfig>(siteContent, CONFIG_ID, { adminPassword: newPassword });
}
