-- AlterTable
ALTER TABLE "Pacote" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "imagemUrl" TEXT,
ADD COLUMN     "titulo" TEXT NOT NULL DEFAULT 'Título Provisório';
