import { pacoteService } from "../services/pacoteService.js";
import { AppError } from "../utils/AppError.js";

export const pacoteController = {
  getAll: async (req, res) => {
    const result = await pacoteService.findAll();
    res.json(result);
  },

  getOne: async (req, res) => {
    const { id } = req.params
    const pacote = await pacoteService.findById(id);
    if (!pacote) throw new AppError("Pacote não encontrado", 404);
    res.json(pacote);
  },

  create: async (req, res) => {
    const dados = {
      ...req.body,
      id_ponto_descarte: req.userId
    };

    const novo = await pacoteService.create(dados);
    res.status(201).json(novo);
  },

  update: async (req, res) => {
    const { id } = req.params
    const dados = req.body
    const att = await pacoteService.update(id, dados);
    res.json(att);
  },

  delete: async (req, res) => {
    const { id } = req.params
    await pacoteService.delete(id);
    res.status(204).send();
  },
};
