import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { proposalsTable, clientsTable, productsTable, activitiesTable } from "@workspace/db/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PRO-${year}-${random}`;
}

router.get("/proposals", async (req, res) => {
  try {
    const { clientId, status, search } = req.query as Record<string, string>;
    const conditions = [];

    if (clientId) conditions.push(eq(proposalsTable.clientId, parseInt(clientId)));
    if (status) conditions.push(eq(proposalsTable.status, status));

    const proposals = conditions.length > 0
      ? await db.select().from(proposalsTable).where(and(...conditions)).orderBy(desc(proposalsTable.createdAt))
      : await db.select().from(proposalsTable).orderBy(desc(proposalsTable.createdAt));

    const enriched = await Promise.all(proposals.map(async (p) => {
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
      };
    }));

    let result = enriched;
    if (search) {
      const s = search.toLowerCase();
      result = enriched.filter(p =>
        p.clientName?.toLowerCase().includes(s) ||
        p.companyName?.toLowerCase().includes(s) ||
        p.proposalNumber.toLowerCase().includes(s)
      );
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing proposals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/proposals", async (req, res) => {
  try {
    const data = req.body;
    const [proposal] = await db.insert(proposalsTable).values({
      ...data,
      proposalNumber: generateProposalNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await db.insert(activitiesTable).values({
      clientId: proposal.clientId,
      type: "proposta_criada",
      description: `Proposta ${proposal.proposalNumber} criada`,
      createdBy: data.ownerName || "Sistema",
      createdAt: new Date(),
    });

    res.status(201).json({ ...proposal, createdAt: proposal.createdAt.toISOString(), updatedAt: proposal.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating proposal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/proposals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [proposal] = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id));
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, proposal.clientId));
    let productName = null;
    if (proposal.productId) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, proposal.productId));
      productName = product?.name ?? null;
    }

    res.json({
      ...proposal,
      clientName: client?.fullName ?? null,
      companyName: client?.companyName ?? null,
      productName,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting proposal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/proposals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [proposal] = await db
      .update(proposalsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(proposalsTable.id, id))
      .returning();
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    res.json({ ...proposal, createdAt: proposal.createdAt.toISOString(), updatedAt: proposal.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating proposal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/proposals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(proposalsTable).where(eq(proposalsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting proposal");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/proposals/:id/send", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { subject, message } = req.body;
    const now = new Date();

    const [proposal] = await db
      .update(proposalsTable)
      .set({
        status: "enviada",
        sentAt: now.toISOString(),
        updatedAt: now,
      })
      .where(eq(proposalsTable.id, id))
      .returning();

    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    await db.insert(activitiesTable).values({
      clientId: proposal.clientId,
      type: "proposta_enviada",
      description: `Proposta ${proposal.proposalNumber} enviada por email: "${subject}"`,
      createdBy: proposal.ownerName || "Sistema",
      createdAt: now,
    });

    res.json({ ...proposal, createdAt: proposal.createdAt.toISOString(), updatedAt: proposal.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error sending proposal");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
