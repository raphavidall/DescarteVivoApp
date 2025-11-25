import { transacaoService } from "../services/transacaoService.js";

export const transacaoController = {
  getAll: async (req, res) => {
    res.json(await transacaoService.findAll());
  },

  getOne: async (req, res) => {
    const t = await transacaoService.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Transação não encontrada" });
    res.json(t);
  },

  create: async (req, res) => {
    const nova = await transacaoService.create(req.body);
    res.status(201).json(nova);
  },
};
