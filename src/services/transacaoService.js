import prisma from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

export const transacaoService = {
  findAll: () =>
    prisma.transacao.findMany({
      include: {
        origem: true,
        destino: true,
      },
    }),

  findById: (id) =>
    prisma.transacao.findUnique({
      where: { id: Number(id) },
      include: {
        origem: true,
        destino: true,
      },
    }),

  create: async (data) => {
    await prisma.usuario.update({
      where: { id: data.id_destino },
      data: { saldo_moedas: { increment: data.valor } }
    });
  
    return prisma.transacao.create({ data });
  },

  // Verifica se tem saldo e DEBITA (Tira da conta do destino)
  reservarSaldo: async (pagadorId, valor, tipo, pacoteId) => {
    const pagador = await prisma.usuario.findUnique({ where: { id: pagadorId } });
    
    if (pagador.saldo_moedas < valor) {
      throw new AppError(`Saldo insuficiente. Necessário: ${valor}, Atual: ${pagador.saldo_moedas}`, 402);
    }

    await prisma.usuario.update({
      where: { id: pagadorId },
      data: { saldo_moedas: { decrement: valor } }
    });

    await prisma.transacao.create({
      data: {
        id_origem: pagadorId,
        id_destino: null, // Dinheiro fica no sistema
        valor: valor,
        tipo: tipo,
        id_referencia: pacoteId
      }
    });
  },

  // CREDITA (Paga ao beneficiário usando o dinheiro que já estava no sistema)
  liberarPagamento: async (recebedorId, valor, tipo, pacoteId) => {
    await prisma.usuario.update({
      where: { id: recebedorId },
      data: { saldo_moedas: { increment: valor } }
    });

    await prisma.transacao.create({
      data: {
        id_origem: null, // Sai do sistema
        id_destino: recebedorId,
        valor: valor,
        tipo: tipo,
        id_referencia: pacoteId
      }
    });
  }

};
