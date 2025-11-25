import { Router } from "express";
import { mensagemController } from "../controllers/mensagemController.js";

const router = Router();

router.get("/:id_pacote", mensagemController.getByPacote);
router.post("/", mensagemController.create);

export default router;
