import fs from "fs";
import path from "path";
import { atomicWriteJSON } from "@/lib/atomicWrite";

const CONFIG_FILE = path.join(process.cwd(), "data", "config.json");

interface SiteConfig {
  adminPassword: string;
}

function readConfig(): SiteConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return { adminPassword: process.env.ADMIN_PASSWORD ?? "114891" };
}

function writeConfig(config: SiteConfig): void {
  atomicWriteJSON(CONFIG_FILE, config);
}

export function getAdminPassword(): string {
  return readConfig().adminPassword;
}

export function setAdminPassword(newPassword: string): void {
  const config = readConfig();
  config.adminPassword = newPassword;
  writeConfig(config);
}
