import { Router } from "express";
import { lojaController } from "../controllers/lojaController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", lojaController.getAll);
router.get("/:id", lojaController.getOne);

router.post("/", authMiddleware, lojaController.create);
router.put("/:id", authMiddleware, lojaController.update);
router.delete("/:id", authMiddleware, lojaController.delete);

export default router;
