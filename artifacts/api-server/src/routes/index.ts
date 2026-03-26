import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import productsRouter from "./products";
import proposalsRouter from "./proposals";
import followupsRouter from "./followups";
import pipelineRouter from "./pipeline";
import activitiesRouter from "./activities";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(productsRouter);
router.use(proposalsRouter);
router.use(followupsRouter);
router.use(pipelineRouter);
router.use(activitiesRouter);
router.use(dashboardRouter);

export default router;
