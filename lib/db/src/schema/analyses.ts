import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("processing"), // processing | complete | error
  fileNames: jsonb("file_names").notNull().$type<string[]>(),
  fileTypes: jsonb("file_types").notNull().$type<string[]>(),
  summary: text("summary"),
  keyPoints: jsonb("key_points").$type<string[]>(),
  keyMetrics: jsonb("key_metrics").$type<Array<{ label: string; value: string }>>(),
  nodes: jsonb("nodes").$type<unknown[]>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
