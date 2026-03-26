import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdBy: text("created_by").notNull().default("Sistema"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
