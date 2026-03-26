import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, ilike, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const { category, search, active } = req.query as Record<string, string>;
    const conditions = [];

    if (category) conditions.push(eq(productsTable.category, category));
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (active !== undefined) conditions.push(eq(productsTable.active, active === "true"));

    const products = conditions.length > 0
      ? await db.select().from(productsTable).where(and(...conditions)).orderBy(productsTable.name)
      : await db.select().from(productsTable).orderBy(productsTable.name);

    res.json(products.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const [product] = await db.insert(productsTable).values({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json({ ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error getting product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .update(productsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
