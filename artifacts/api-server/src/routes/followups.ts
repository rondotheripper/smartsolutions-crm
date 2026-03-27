import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { followupsTable, clientsTable, activitiesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { sendFollowupNotification } from "../lib/email";

const router: IRouter = Router();

async function enrichFollowup(f: typeof followupsTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, f.clientId));
  return {
    ...f,
    clientName: client?.fullName ?? null,
    companyName: client?.companyName ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

router.get("/followups", async (req, res) => {
  try {
    const { clientId, status, today, overdue } = req.query as Record<string, string>;
    const conditions = [];

    if (clientId) conditions.push(eq(followupsTable.clientId, parseInt(clientId)));
    if (status) conditions.push(eq(followupsTable.status, status));

    const followups = conditions.length > 0
      ? await db.select().from(followupsTable).where(and(...conditions)).orderBy(followupsTable.scheduledAt)
      : await db.select().from(followupsTable).orderBy(followupsTable.scheduledAt);

    let result = followups;
    const now = new Date();

    if (today === "true") {
      const todayStr = now.toISOString().split("T")[0];
      result = result.filter(f => f.scheduledAt.startsWith(todayStr) && f.status === "pendente");
    }

    if (overdue === "true") {
      result = result.filter(f => new Date(f.scheduledAt) < now && f.status === "pendente");
    }

    const enriched = await Promise.all(result.map(enrichFollowup));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error listing followups");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/followups", async (req, res) => {
  try {
    const data = req.body;
    const [followup] = await db.insert(followupsTable).values({
      ...data,
      status: "pendente",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, followup.clientId));
    await db.insert(activitiesTable).values({
      clientId: followup.clientId,
      type: "followup_agendado",
      description: `Follow-up agendado para ${followup.scheduledAt} - ${followup.reason}`,
      createdBy: "Sistema",
      createdAt: new Date(),
    });

    await db.update(clientsTable)
      .set({ nextFollowupDate: followup.scheduledAt, updatedAt: new Date() })
      .where(eq(clientsTable.id, followup.clientId));

    // Send email notification (non-blocking)
    sendFollowupNotification({
      clientName: client?.fullName ?? "Desconhecido",
      companyName: client?.companyName ?? "—",
      scheduledAt: followup.scheduledAt,
      reason: followup.reason,
      priority: followup.priority,
    });

    res.status(201).json({
      ...followup,
      clientName: client?.fullName ?? null,
      companyName: client?.companyName ?? null,
      createdAt: followup.createdAt.toISOString(),
      updatedAt: followup.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating followup");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/followups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [followup] = await db.select().from(followupsTable).where(eq(followupsTable.id, id));
    if (!followup) return res.status(404).json({ error: "Followup not found" });
    res.json(await enrichFollowup(followup));
  } catch (err) {
    req.log.error({ err }, "Error getting followup");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/followups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [followup] = await db
      .update(followupsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(followupsTable.id, id))
      .returning();
    if (!followup) return res.status(404).json({ error: "Followup not found" });
    res.json(await enrichFollowup(followup));
  } catch (err) {
    req.log.error({ err }, "Error updating followup");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/followups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(followupsTable).where(eq(followupsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting followup");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/followups/:id/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [followup] = await db
      .update(followupsTable)
      .set({ status: "concluido", updatedAt: new Date() })
      .where(eq(followupsTable.id, id))
      .returning();
    if (!followup) return res.status(404).json({ error: "Followup not found" });

    await db.insert(activitiesTable).values({
      clientId: followup.clientId,
      type: "followup_concluido",
      description: `Follow-up concluído: ${followup.reason}`,
      createdBy: "Sistema",
      createdAt: new Date(),
    });

    res.json(await enrichFollowup(followup));
  } catch (err) {
    req.log.error({ err }, "Error completing followup");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
