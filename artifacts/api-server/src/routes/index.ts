import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./generateImage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generateImageRouter);

export default router;
