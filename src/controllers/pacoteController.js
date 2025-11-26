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
    const { id_material, peso_kg, localizacao, titulo, descricao } = req.body;

    const { filename: imagemUrl } = req.file || {};

    let localizacaoParsed = null;
    if (localizacao) {
        try {
            localizacaoParsed = JSON.parse(localizacao);
        } catch (e) {
            // lidar com erro de parse se necessário
        }
    }
    
    const novoPacote = await pacoteService.create({
      id_ponto_descarte: userId,
      id_material: Number(id_material),
      peso_kg: Number(peso_kg),
      localizacao: localizacaoParsed,
      titulo,
      descricao,
      imagemUrl // <--- Salva o nome do arquivo
    });
    
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
