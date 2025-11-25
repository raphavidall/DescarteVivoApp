-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "saldo_moedas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endereco" JSONB,
    "refresh_token" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_por_kg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pacote" (
    "id" SERIAL NOT NULL,
    "id_ponto_descarte" INTEGER NOT NULL,
    "id_ponto_coleta" INTEGER,
    "id_ponto_destino" INTEGER,
    "status" TEXT NOT NULL,
    "valor_pacote_moedas" DOUBLE PRECISION NOT NULL,
    "valor_coleta_moedas" DOUBLE PRECISION,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "localizacao" JSONB,
    "id_material" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_coleta" TIMESTAMP(3),
    "data_destino" TIMESTAMP(3),

    CONSTRAINT "Pacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" SERIAL NOT NULL,
    "id_pacote" INTEGER NOT NULL,
    "id_remetente" INTEGER NOT NULL,
    "mensagem" TEXT NOT NULL,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLoja" (
    "id" SERIAL NOT NULL,
    "id_vendedor" INTEGER NOT NULL,
    "nome_item" TEXT NOT NULL,
    "descricao" TEXT,
    "valor_moedas" DOUBLE PRECISION NOT NULL,
    "tipo_item" TEXT,
    "disponibilidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ItemLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transacao" (
    "id" SERIAL NOT NULL,
    "id_origem" INTEGER,
    "id_destino" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "id_referencia" INTEGER,
    "data_transacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_documento_key" ON "Usuario"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Material_nome_key" ON "Material"("nome");

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_id_ponto_descarte_fkey" FOREIGN KEY ("id_ponto_descarte") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_id_ponto_coleta_fkey" FOREIGN KEY ("id_ponto_coleta") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_id_ponto_destino_fkey" FOREIGN KEY ("id_ponto_destino") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_id_pacote_fkey" FOREIGN KEY ("id_pacote") REFERENCES "Pacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLoja" ADD CONSTRAINT "ItemLoja_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_id_origem_fkey" FOREIGN KEY ("id_origem") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_id_destino_fkey" FOREIGN KEY ("id_destino") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
