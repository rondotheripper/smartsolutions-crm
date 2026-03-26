import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { activitiesTable, clientsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/activities", async (req, res) => {
  try {
    const { clientId, limit } = req.query as Record<string, string>;
    const lim = limit ? parseInt(limit) : 20;

    let activities;
    if (clientId) {
      activities = await db.select().from(activitiesTable)
        .where(eq(activitiesTable.clientId, parseInt(clientId)))
        .orderBy(desc(activitiesTable.createdAt))
        .limit(lim);
    } else {
      activities = await db.select().from(activitiesTable)
        .orderBy(desc(activitiesTable.createdAt))
        .limit(lim);
    }

    const enriched = await Promise.all(activities.map(async (a) => {
      if (!a.clientId) return { ...a, clientName: null, companyName: null, createdAt: a.createdAt.toISOString() };
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, a.clientId));
      return {
        ...a,
        clientName: client?.fullName ?? null,
        companyName: client?.companyName ?? null,
        createdAt: a.createdAt.toISOString(),
      };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error listing activities");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/activities", async (req, res) => {
  try {
    const [activity] = await db.insert(activitiesTable).values({
      ...req.body,
      createdAt: new Date(),
    }).returning();
    res.status(201).json({ ...activity, createdAt: activity.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
