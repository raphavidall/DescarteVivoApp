import { AppError } from "../utils/AppError.js";

export const errorMiddleware = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  console.error(err); // Log para o desenvolvedor ver no terminal

  // Tratamento de erros específicos do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      status: "error", 
      message: "Dados duplicados (ex: email ou documento já existente)." 
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      status: "error", 
      message: "Registro não encontrado." 
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor.",
  });
};