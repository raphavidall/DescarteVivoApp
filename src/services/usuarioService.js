import { prisma } from "../config/database.js";

export const usuarioService = {
  findAll: () => prisma.usuario.findMany(),

  findById: (id) =>
    prisma.usuario.findUnique({
      where: { id: Number(id) },
    }),

  create: (data) =>
    prisma.usuario.create({
      data,
    }),

  update: (id, data) =>
    prisma.usuario.update({
      where: { id: Number(id) },
      data,
    }),

  delete: (id) =>
    prisma.usuario.delete({
      where: { id: Number(id) },
    }),
};