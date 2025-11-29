-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_id_remetente_fkey" FOREIGN KEY ("id_remetente") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
