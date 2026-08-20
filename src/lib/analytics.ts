import { analyticsMonths } from "@/lib/db/schema";
import { getCollection, saveCollection } from "@/lib/db/store";

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

export async function getAnalytics(): Promise<MonthlyAnalytics[]> {
  try {
    return await getCollection<MonthlyAnalytics>(analyticsMonths);
  } catch {
    return [];
  }
}

export async function saveAnalytics(data: MonthlyAnalytics[]): Promise<void> {
  await saveCollection(analyticsMonths, data);
}

export async function upsertMonth(month: MonthlyAnalytics): Promise<MonthlyAnalytics[]> {
  const all = await getAnalytics();
  const idx = all.findIndex((m) => m.id === month.id);
  if (idx === -1) {
    all.push(month);
  } else {
    all[idx] = month;
  }
  all.sort((a, b) => b.id.localeCompare(a.id));
  await saveAnalytics(all);
  return all;
}

export async function deleteMonth(id: string): Promise<MonthlyAnalytics[]> {
  const all = (await getAnalytics()).filter((m) => m.id !== id);
  await saveAnalytics(all);
  return all;
}
