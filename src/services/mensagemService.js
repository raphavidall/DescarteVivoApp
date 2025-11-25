import { prisma } from "../config/database.js";

export const mensagemService = {
  findByPacote: (id_pacote) =>
    prisma.mensagem.findMany({
      where: { id_pacote: Number(id_pacote) },
    }),

  create: (data) =>
    prisma.mensagem.create({
      data,
    }),
};