import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  taxId: text("tax_id"),
  address: text("address"),
  segment: text("segment").notNull().default("Empresas"),
  leadSource: text("lead_source").notNull().default("Chamada Fria"),
  interestedProduct: text("interested_product").notNull().default(""),
  pipelineStatus: text("pipeline_status").notNull().default("chamada_efectuada"),
  lastCallDate: text("last_call_date"),
  nextFollowupDate: text("next_followup_date"),
  ownerName: text("owner_name").notNull().default("Comercial"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
