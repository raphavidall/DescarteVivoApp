import { Router } from "express";
import { transacaoController } from "../controllers/transacaoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, transacaoController.getAll);
router.get("/:id", authMiddleware, transacaoController.getOne);
router.post("/", authMiddleware, transacaoController.create);

export default router;
