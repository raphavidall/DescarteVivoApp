import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { pacoteController } from "../controllers/pacoteController.js";
import { mensagemController } from "../controllers/mensagemController.js";


const router = Router();

router.get("/", pacoteController.getAll);
router.get("/:id", pacoteController.getOne);
router.post("/", authMiddleware, pacoteController.create);
router.put("/:id", pacoteController.update);
router.delete("/:id", pacoteController.delete);

// Mensagens
router.get("/:id_pacote/mensagens", mensagemController.getByPacote);
router.post("/:id_pacote/mensagens", authMiddleware, mensagemController.create);

export default router;
