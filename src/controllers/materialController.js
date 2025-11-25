import { materialService } from "../services/materialService.js";

export const materialController = {
  getAll: async (req, res) => {
    const result = await materialService.findAll();
    res.json(result);
  },

  getOne: async (req, res) => {
    const item = await materialService.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Material não encontrado" });
    res.json(item);
  },

  create: async (req, res) => {
    const novo = await materialService.create(req.body);
    res.status(201).json(novo);
  },

  update: async (req, res) => {
    const att = await materialService.update(req.params.id, req.body);
    res.json(att);
  },

  delete: async (req, res) => {
    await materialService.delete(req.params.id);
    res.status(204).send();
  },
};