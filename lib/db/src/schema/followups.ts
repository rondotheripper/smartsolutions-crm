import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const followupsTable = pgTable("followups", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  priority: text("priority").notNull().default("media"),
  status: text("status").notNull().default("pendente"),
  sendEmailAlert: boolean("send_email_alert").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFollowupSchema = createInsertSchema(followupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFollowup = z.infer<typeof insertFollowupSchema>;
export type Followup = typeof followupsTable.$inferSelect;
