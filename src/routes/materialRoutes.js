import { Router } from "express";
import { materialController } from "../controllers/materialController.js";

const router = Router();

router.get("/", materialController.getAll);
router.get("/:id", materialController.getOne);
router.post("/", materialController.create);
router.put("/:id", materialController.update);
router.delete("/:id", materialController.delete);

export default router;
