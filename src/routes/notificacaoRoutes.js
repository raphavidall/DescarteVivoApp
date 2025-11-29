import { Router } from "express";
import { notificacaoController } from "../controllers/notificacaoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, notificacaoController.getAll);
router.put("/:id/lida", authMiddleware, notificacaoController.markRead);

export default router;