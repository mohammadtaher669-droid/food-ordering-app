import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./generateImage";
import translateRouter from "./translate";
import adminAuthRouter from "./adminAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateImageRouter);
router.use(translateRouter);
router.use(adminAuthRouter);

export default router;
