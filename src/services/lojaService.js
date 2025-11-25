import prisma from "../prisma/client.js";

export const lojaService = {
  findAll: () => prisma.itemLoja.findMany(),

  findById: (id) =>
    prisma.itemLoja.findUnique({ where: { id: Number(id) } }),

  create: (data) =>
    prisma.itemLoja.create({ data }),

  update: (id, data) =>
    prisma.itemLoja.update({
      where: { id: Number(id) },
      data,
    }),

  delete: (id) =>
    prisma.itemLoja.delete({
      where: { id: Number(id) },
    }),
};
