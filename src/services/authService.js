import { prisma } from "../config/database.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const authService = {
  async register(data) {
    const hash = await bcrypt.hash(data.senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome_completo: data.nome_completo,
        email: data.email,
        senha_hash: hash,
        tipo_documento: data.tipo_documento,
        documento: data.documento,
        endereco: data.endereco
      },
    });

    return usuario;
  },

  async login(email, senha) {
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) return null;

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return null;

    const accessToken = jwt.sign(
      { userId: user.id },
      ACCESS_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    await prisma.usuario.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    return { accessToken, refreshToken, user };
  },

  async refresh(token) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      const user = await prisma.usuario.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.refresh_token !== token) return null;

      const newAccess = jwt.sign(
        { userId: user.id },
        ACCESS_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return newAccess;
    } catch {
      return null;
    }
  },

  async logout(id) {
    await prisma.usuario.update({
      where: { id },
      data: { refresh_token: null },
    });
  }
};