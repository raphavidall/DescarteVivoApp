import { prisma } from "../config/database.js";

export const notificacaoService = {
  // Criar uma notificação
  create: async (data) => {
    return prisma.notificacao.create({ data });
  },

  // Listar notificações de um usuário
  findAllByUser: async (userId) => {
    return prisma.notificacao.findMany({
      where: { id_usuario: Number(userId) },
      orderBy: { data_criacao: 'desc' },
      include: {
        pacote: true,
        remetente: true
      }
    });
  },
  
  // Marcar como lida (Opcional por enquanto)
  markAsRead: async (id) => {
    return prisma.notificacao.update({
      where: { id: Number(id) },
      data: { lida: true }
    });
  }
};