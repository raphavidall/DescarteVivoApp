import prisma from "../prisma/client.js";

export const materialService = {
  findAll: () => prisma.material.findMany(),

  findById: (id) =>
    prisma.material.findUnique({
      where: { id: Number(id) },
    }),

  create: (data) =>
    prisma.material.create({
      data,
    }),

  update: (id, data) =>
    prisma.material.update({
      where: { id: Number(id) },
      data,
    }),

  delete: (id) =>
    prisma.material.delete({
      where: { id: Number(id) },
    }),
};