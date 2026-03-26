import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable, activitiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/pipeline", async (req, res) => {
  try {
    const clients = await db.select().from(clientsTable).orderBy(clientsTable.updatedAt);

    const mapClient = (c: typeof clientsTable.$inferSelect) => ({
      id: c.id,
      fullName: c.fullName,
      companyName: c.companyName,
      phone: c.phone,
      email: c.email,
      interestedProduct: c.interestedProduct,
      pipelineStatus: c.pipelineStatus,
      nextFollowupDate: c.nextFollowupDate,
      notes: c.notes,
    });

    res.json({
      chamadaEfectuada: clients.filter(c => c.pipelineStatus === "chamada_efectuada").map(mapClient),
      clienteNaoInteressado: clients.filter(c => c.pipelineStatus === "cliente_nao_interessado").map(mapClient),
      clienteInteressado: clients.filter(c => c.pipelineStatus === "cliente_interessado").map(mapClient),
      chamadaFollowup: clients.filter(c => c.pipelineStatus === "chamada_followup").map(mapClient),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting pipeline");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/pipeline/:clientId/status", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const { pipelineStatus, nextFollowupDate } = req.body;

    const [client] = await db
      .update(clientsTable)
      .set({
        pipelineStatus,
        nextFollowupDate: nextFollowupDate ?? null,
        updatedAt: new Date(),
      })
      .where(eq(clientsTable.id, clientId))
      .returning();

    if (!client) return res.status(404).json({ error: "Client not found" });

    const statusLabels: Record<string, string> = {
      chamada_efectuada: "Chamada Efectuada",
      cliente_nao_interessado: "Cliente Não Interessado",
      cliente_interessado: "Cliente Interessado",
      chamada_followup: "Chamada de Follow-up",
    };

    await db.insert(activitiesTable).values({
      clientId: client.id,
      type: "pipeline_mudanca",
      description: `${client.fullName} movido para "${statusLabels[pipelineStatus] || pipelineStatus}"`,
      createdBy: "Sistema",
      createdAt: new Date(),
    });

    res.json({ ...client, createdAt: client.createdAt.toISOString(), updatedAt: client.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating pipeline status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
