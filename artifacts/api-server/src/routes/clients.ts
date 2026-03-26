import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable, activitiesTable } from "@workspace/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/clients", async (req, res) => {
  try {
    const { search, status, product, segment } = req.query as Record<string, string>;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(clientsTable.fullName, `%${search}%`),
          ilike(clientsTable.companyName, `%${search}%`),
          ilike(clientsTable.email, `%${search}%`)
        )
      );
    }
    if (status) conditions.push(eq(clientsTable.pipelineStatus, status));
    if (product) conditions.push(ilike(clientsTable.interestedProduct, `%${product}%`));
    if (segment) conditions.push(eq(clientsTable.segment, segment));

    const clients = conditions.length > 0
      ? await db.select().from(clientsTable).where(and(...conditions)).orderBy(clientsTable.createdAt)
      : await db.select().from(clientsTable).orderBy(clientsTable.createdAt);

    const result = clients.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing clients");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const data = req.body;
    const [client] = await db.insert(clientsTable).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await db.insert(activitiesTable).values({
      clientId: client.id,
      type: "cliente_criado",
      description: `Cliente ${client.fullName} (${client.companyName}) criado`,
      createdBy: data.ownerName || "Sistema",
      createdAt: new Date(),
    });

    res.status(201).json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json({ ...client, createdAt: client.createdAt.toISOString(), updatedAt: client.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error getting client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const [client] = await db
      .update(clientsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientsTable.id, id))
      .returning();

    if (!client) return res.status(404).json({ error: "Client not found" });

    await db.insert(activitiesTable).values({
      clientId: client.id,
      type: "cliente_atualizado",
      description: `Cliente ${client.fullName} atualizado`,
      createdBy: data.ownerName || "Sistema",
      createdAt: new Date(),
    });

    res.json({ ...client, createdAt: client.createdAt.toISOString(), updatedAt: client.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(clientsTable).where(eq(clientsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id/activities", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const activities = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.clientId, id))
      .orderBy(activitiesTable.createdAt);
    res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error getting client activities");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
