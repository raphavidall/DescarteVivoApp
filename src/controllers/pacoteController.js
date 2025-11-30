import { pacoteService } from "../services/pacoteService.js";
import { AppError } from "../utils/AppError.js";

export const pacoteController = {
  get: async (req, res) => {
    const result = await pacoteService.find();
    res.json(result);
  },

  getAll: async (req, res) => {
    const result = await pacoteService.findAll(req.userId);
    res.json(result);
  },

  getMy; async (req, res) => {
    const result = await pacoteService.findMy(req.userId);
    res.json(result)
  }

  getOne: async (req, res) => {
    const { id } = req.params
    const pacote = await pacoteService.findById(id);
    if (!pacote) throw new AppError("Pacote não encontrado", 404);
    res.json(pacote);
  },

  create: async (req, res) => {
    const { id_material, peso_kg, localizacao, titulo, descricao } = req.body;
    const imagemUrl = req.file?.path || req.file?.secure_url || req.file?.url || null;
    const userId = req.userId;

    let localizacaoParsed = null;
    if (localizacao) {
        try {
            localizacaoParsed = JSON.parse(localizacao);
        } catch (e) {
            // lidar com erro de parse se necessário
        }
    }
    
    const idMaterialInt = parseInt(id_material, 10); 
    const pesoFloat = parseFloat(peso_kg);

    if (isNaN(idMaterialInt)) {
      return res.status(400).json({ message: "ID do material inválido." });
    }

    const novo = await pacoteService.create({
      id_ponto_descarte: userId,
      id_material: idMaterialInt,
      peso_kg: pesoFloat,
      localizacao: localizacaoParsed,
      titulo,
      descricao,
      imagemUrl
    });

    res.status(201).json(novo);
  },

  update: async (req, res) => {
    const { id } = req.params;
    const dadosAtualizacao = { 
      ...req.body, 
      quem_alterou: req.userId 
    };
    const att = await pacoteService.update(id, dadosAtualizacao);
    res.json(att);
  },

  delete: async (req, res) => {
    const { id } = req.params
    await pacoteService.delete(id);
    res.status(204).send();
  },

};
