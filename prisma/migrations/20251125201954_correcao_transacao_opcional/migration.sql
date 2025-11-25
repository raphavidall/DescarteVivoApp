-- DropForeignKey
ALTER TABLE "Transacao" DROP CONSTRAINT "Transacao_id_destino_fkey";

-- AlterTable
ALTER TABLE "Transacao" ALTER COLUMN "id_destino" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_id_destino_fkey" FOREIGN KEY ("id_destino") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
