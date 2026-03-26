import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable, proposalsTable, followupsTable, activitiesTable, productsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const clients = await db.select().from(clientsTable);
    const proposals = await db.select().from(proposalsTable);
    const followups = await db.select().from(followupsTable);
    const activities = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(10);

    const totalClients = clients.length;
    const interestedClients = clients.filter(c => c.pipelineStatus === "cliente_interessado").length;
    const notInterestedClients = clients.filter(c => c.pipelineStatus === "cliente_nao_interessado").length;

    const pendingFollowups = followups.filter(f => f.status === "pendente").length;
    const overdueFollowups = followups.filter(f => f.status === "pendente" && new Date(f.scheduledAt) < now).length;
    const todayFollowups = followups.filter(f => f.status === "pendente" && f.scheduledAt.startsWith(todayStr)).length;

    const proposalsSent = proposals.filter(p => ["enviada", "aguardando", "aceite", "recusada"].includes(p.status)).length;
    const proposalsAccepted = proposals.filter(p => p.status === "aceite").length;
    const proposalsRejected = proposals.filter(p => p.status === "recusada").length;

    const totalPotentialValue = proposals
      .filter(p => p.amount && !["recusada"].includes(p.status))
      .reduce((sum, p) => sum + (parseFloat(p.amount || "0") || 0), 0);

    const pipelineSummary = {
      chamadaEfectuada: clients.filter(c => c.pipelineStatus === "chamada_efectuada").length,
      clienteNaoInteressado: clients.filter(c => c.pipelineStatus === "cliente_nao_interessado").length,
      clienteInteressado: clients.filter(c => c.pipelineStatus === "cliente_interessado").length,
      chamadaFollowup: clients.filter(c => c.pipelineStatus === "chamada_followup").length,
    };

    const recentProposals = proposals
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const enrichedProposals = await Promise.all(recentProposals.map(async (p) => {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, p.clientId));
      let productName = null;
      if (p.productId) {
        const [product] = await db.select().from(productsTable).where(eq(productsTable.id, p.productId));
        productName = product?.name ?? null;
      }
      return {
        ...p,
        clientName: client?.fullName ?? null,
        companyName: client?.companyName ?? null,
        productName,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        sentAt: p.sentAt ?? null,
      };
    }));

    const upcomingFollowups = followups
      .filter(f => f.status === "pendente")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);

    const enrichedFollowups = await Promise.all(upcomingFollowups.map(async (f) => {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, f.clientId));
      return {
        ...f,
        clientName: client?.fullName ?? null,
        companyName: client?.companyName ?? null,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      };
    }));

    const recentClients = clients
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(c => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() }));

    const enrichedActivities = await Promise.all(activities.map(async (a) => {
      if (!a.clientId) return { ...a, clientName: null, companyName: null, createdAt: a.createdAt.toISOString() };
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, a.clientId));
      return {
        ...a,
        clientName: client?.fullName ?? null,
        companyName: client?.companyName ?? null,
        createdAt: a.createdAt.toISOString(),
      };
    }));

    res.json({
      totalClients,
      interestedClients,
      notInterestedClients,
      pendingFollowups,
      overdueFollowups,
      todayFollowups,
      proposalsSent,
      proposalsAccepted,
      proposalsRejected,
      totalPotentialValue: totalPotentialValue.toFixed(2),
      pipelineSummary,
      recentProposals: enrichedProposals,
      upcomingFollowups: enrichedFollowups,
      recentActivities: enrichedActivities,
      recentClients,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
