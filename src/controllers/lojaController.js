import { lojaService } from "../services/lojaService.js";

export const lojaController = {
  getAll: async (req, res) => {
    res.json(await lojaService.findAll());
  },

  getOne: async (req, res) => {
    const item = await lojaService.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item não encontrado" });
    res.json(item);
  },

  create: async (req, res) => {
    const novo = await lojaService.create(req.body);
    res.status(201).json(novo);
  },

  update: async (req, res) => {
    const att = await lojaService.update(req.params.id, req.body);
    res.json(att);
  },

  delete: async (req, res) => {
    await lojaService.delete(req.params.id);
    res.status(204).send();
  },
};
