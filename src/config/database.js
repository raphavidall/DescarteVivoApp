// config/database.js
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Instância única do Prisma
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});


async function testConnection() {
    try {
        await prisma.$connect();
        console.log("🐘 Conectado ao banco de dados com sucesso!");
    } catch (error) {
        console.error("❌ Falha ao conectar no banco:", error);
    }
}

testConnection();