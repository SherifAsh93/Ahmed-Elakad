import { put } from "@vercel/blob";
import { readFileSync } from "fs";

const content = readFileSync("./src/data/content.json", "utf-8");
await put("content.json", content, {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
});
console.log("✅ Content seeded to Vercel Blob!");
process.exit(0);
