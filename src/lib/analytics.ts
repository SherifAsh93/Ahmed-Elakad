import fs from "fs";
import path from "path";
import { atomicWriteJSON } from "@/lib/atomicWrite";

export interface InstagramPost {
  id: string;
  date: string;
  format: "Reel" | "Carousel" | "Image" | "Story";
  topic: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  postTime: string;
  cta: string;
}

export interface AuditResult {
  createdAt: string;
  summary: string;
  keyInsight: string;
  topPerformers: { topic: string; avgReach: number; insight: string }[];
  formatBreakdown: { format: string; count: number; avgReach: number; pctContent: string; pctReach: string }[];
  bestPostTimes: { time: string; avgReach: number; count: number; insight: string }[];
  ctaAnalysis: { cta: string; avgEngagement: number; insight: string }[];
  recommendations: string[];
  bioSuggestions: string;
}

export interface MonthlyAnalytics {
  id: string; // "2026-06"
  monthLabel: string; // "June 2026"
  posts: InstagramPost[];
  audit?: AuditResult;
}

const ANALYTICS_FILE = path.join(process.cwd(), "data", "analytics.json");

function ensureDir() {
  const dir = path.dirname(ANALYTICS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getAnalytics(): MonthlyAnalytics[] {
  ensureDir();
  if (!fs.existsSync(ANALYTICS_FILE)) return [];
  try {
    const raw = fs.readFileSync(ANALYTICS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAnalytics(data: MonthlyAnalytics[]): void {
  ensureDir();
  atomicWriteJSON(ANALYTICS_FILE, data);
}

export function upsertMonth(month: MonthlyAnalytics): MonthlyAnalytics[] {
  const all = getAnalytics();
  const idx = all.findIndex((m) => m.id === month.id);
  if (idx === -1) {
    all.push(month);
  } else {
    all[idx] = month;
  }
  all.sort((a, b) => b.id.localeCompare(a.id));
  saveAnalytics(all);
  return all;
}

export function deleteMonth(id: string): MonthlyAnalytics[] {
  const all = getAnalytics().filter((m) => m.id !== id);
  saveAnalytics(all);
  return all;
}
