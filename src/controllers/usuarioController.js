import { usuarioService } from "../services/usuarioService.js";

export const usuarioController = {
  getAll: async (req, res) => {
    const result = await usuarioService.findAll();
    res.json(result);
  },

  getOne: async (req, res) => {
    const usuario = await usuarioService.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(usuario);
  },

  create: async (req, res) => {
    const novo = await usuarioService.create(req.body);
    res.status(201).json(novo);
  },

  update: async (req, res) => {
    const att = await usuarioService.update(req.params.id, req.body);
    res.json(att);
  },

  markTutorialSeen: async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });
      if (id !== req.userId) return res.sendStatus(403);

      await usuarioService.update(id, {
          tutorial_visto: true,
          premio_recebido: true 
      });

      res.sendStatus(204);
    } catch (error) {
      console.error("ERRO NO UPDATE:", error);
      res.status(500).json({ error: 'Erro ao atualizar status do tutorial' });
    }
  },

  delete: async (req, res) => {
    await usuarioService.delete(req.params.id);
    res.status(204).send();
  },
};