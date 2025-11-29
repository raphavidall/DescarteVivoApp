import { notificacaoService } from "../services/notificacaoService.js";

export const notificacaoController = {
    getAll: async (req, res) => {
        const userId = req.userId; // Vem do AuthMiddleware
        const lista = await notificacaoService.findAllByUser(userId);
        res.json(lista);
      },

    markRead: async (req, res) => {
        await notificacaoService.markAsRead(req.params.id);
        res.status(204).send();
    }   
}