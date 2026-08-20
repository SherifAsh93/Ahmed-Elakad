import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Each table mirrors one of the old data/*.json files: one JSONB "data"
 * column holding the same shape the app already works with, keyed by the
 * same id the app already uses (phone number, message id, etc). This keeps
 * the migration mechanical — swapping the storage engine under lib/*.ts
 * without redesigning the business logic — while still getting real
 * multi-writer-safe persistence instead of a file on disk.
 */

export const siteContent = pgTable("site_content", {
  id: text("id").primaryKey(), // always "site" — singleton row
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey(), // normalized phone digits
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adEnquiries = pgTable("ad_enquiries", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsMonths = pgTable("analytics_months", {
  id: text("id").primaryKey(), // e.g. "2026-06"
  data: jsonb("data").notNull(),
});
