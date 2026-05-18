import fs from "fs";

const CONFIG_FILE = "/home/sherif/data/ahmed-elakad/config.json";

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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getAdminPassword(): string {
  return readConfig().adminPassword;
}

export function setAdminPassword(newPassword: string): void {
  const config = readConfig();
  config.adminPassword = newPassword;
  writeConfig(config);
}
