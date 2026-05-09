import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./generateImage";
import translateRouter from "./translate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateImageRouter);
router.use(translateRouter);

export default router;
