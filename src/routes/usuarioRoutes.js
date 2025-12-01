import { Router } from "express";
import { usuarioController } from "../controllers/usuarioController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", usuarioController.getAll);
router.get("/:id", usuarioController.getOne);
router.post("/", usuarioController.create);
router.put("/:id", usuarioController.update);
router.put("/:id/tutorial-visto", authMiddleware, usuarioController.markTutorialSeen);
router.delete("/:id", usuarioController.delete);

export default router;