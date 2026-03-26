import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposalNumber: text("proposal_number").notNull(),
  clientId: integer("client_id").notNull(),
  productId: integer("product_id"),
  clientEmail: text("client_email").notNull(),
  amount: text("amount"),
  status: text("status").notNull().default("em_preparacao"),
  sentAt: text("sent_at"),
  validUntil: text("valid_until"),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  ownerName: text("owner_name").notNull().default("Comercial"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
