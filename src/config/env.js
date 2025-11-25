// config/env.js
import dotenv from "dotenv";

// Carrega o arquivo .env
dotenv.config();

// Validação simples para garantir que nada crítico está faltando
const requiredEnvs = ["DATABASE_URL", "JWT_SECRET"];

requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Erro fatal: A variável de ambiente ${key} está faltando.`);
    process.exit(1); // Mata o processo se faltar configuração crítica
  }
});

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
};