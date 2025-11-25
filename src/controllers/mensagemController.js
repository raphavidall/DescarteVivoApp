import { mensagemService } from "../services/mensagemService.js";
import { AppError } from "../utils/AppError.js";

export const mensagemController = {
  getByPacote: async (req, res) => {
    const { id_pacote } = req.params;
    const msgs = await mensagemService.findByPacote(id_pacote);
    res.json(msgs);
  },

  create: async (req, res) => {
    const { id_pacote } = req.params;
    const { mensagem } = req.body;
    const id_remetente = req.userId;

    if (!id_pacote || !mensagem) {
      throw new AppError("ID do pacote e mensagem são obrigatórios.");
    }

    const nova = await mensagemService.create({
      id_pacote: Number(id_pacote),
      id_remetente,
      mensagem
    });

    res.status(201).json(nova);
  },
};
