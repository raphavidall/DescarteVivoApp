import prisma from "../prisma/client.js";
import { AppError } from "../utils/AppError.js";

export const pacoteService = {
  findAll: () =>
    prisma.pacote.findMany({
      include: {
        material: true,
        mensagens: true,
        pontoDescarte: true,
        pontoColeta: true,
        pontoDestino: true,
      },
    }),

  findById: (id) =>
    prisma.pacote.findUnique({
      where: { id: Number(id) },
      include: {
        material: true,
        mensagens: true,
        pontoDescarte: true,
        pontoColeta: true,
        pontoDestino: true,
      },
    }),

  create: async (data) => {
    // 1. Validar se o material existe para pegar o preço
    const material = await prisma.material.findUnique({
      where: { id: data.id_material }
    });

    if (!material) {
      throw new AppError("Material não encontrado.");
    }

    // 2. Lógica de Negócio: Calcular valor
    // Valor = Peso * Valor do Material
    const valorCalculado = data.peso_kg * material.valor_por_kg;

    // 3. Criar o pacote com o valor calculado pelo servidor
    return prisma.pacote.create({
      data: {
        id_ponto_descarte: data.id_ponto_descarte,
        id_material: data.id_material,
        peso_kg: data.peso_kg,
        localizacao: data.localizacao,
        status: PACOTE_STATUS.DISPONIVEL, 
        valor_pacote_moedas: valorCalculado,
      },
    });
  },

  update: async (id, data) => {
    const pacote = await prisma.pacote.findUnique({ where: { id: Number(id) } });
    if (!pacote) throw new AppError("Pacote não encontrado", 404);

    const novoStatus = data.status;

    // Lógica baseada na mudança de status solicitada
    switch (novoStatus) {
        
        // --- PASSO 2: Solicitar Destinação ---
        // Quem chama: Ponto de Destino
        case PACOTE_STATUS.AGUARDANDO_APROVACAO:
            // Validação: Destino tem saldo para o Material?
            const destinoId = data.id_ponto_destino;
            const usuarioDestino = await prisma.usuario.findUnique({ where: { id: destinoId }});
            
            if (usuarioDestino.saldo_moedas < pacote.valor_pacote_moedas) {
                throw new AppError("Saldo insuficiente para solicitar este pacote.");
            }
            break;


        // --- PASSO 3: Aprovar Destinação ---
        // Quem chama: Ponto de Descarte
        case PACOTE_STATUS.AGUARDANDO_COLETA:
            // Se veio do passo 2, cobra o Material agora
            if (pacote.status === PACOTE_STATUS.AGUARDANDO_APROVACAO) {
                await transacaoService.reservarSaldo(
                    pacote.id_ponto_destino,
                    pacote.valor_pacote_moedas,
                    TRANSACAO_TIPO.RESERVA_MATERIAL,
                    pacote.id
                );
            }
            break;


        // --- PASSO 4 e 8: Finalizar (DESTINADO) ---
        case PACOTE_STATUS.DESTINADO:
            // Cenário 4: Destino buscou direto (não tem coletor)
            if (!pacote.id_ponto_coleta) {
                // Paga o Material ao Descartador
                await transacaoService.liberarPagamento(
                    pacote.id_ponto_descarte,
                    pacote.valor_pacote_moedas,
                    TRANSACAO_TIPO.PAGAMENTO_MATERIAL,
                    pacote.id
                );
            } 
            // Cenário 8: Veio via Coletor (tem coletor definido)
            else {
                // Paga Material ao Descartador
                await transacaoService.liberarPagamento(
                    pacote.id_ponto_descarte,
                    pacote.valor_pacote_moedas,
                    TRANSACAO_TIPO.PAGAMENTO_MATERIAL,
                    pacote.id
                );
                
                // Paga Serviço ao Coletor (25%)
                const valorServico = pacote.valor_pacote_moedas * 0.25;
                await transacaoService.liberarPagamento(
                    pacote.id_ponto_coleta,
                    valorServico,
                    TRANSACAO_TIPO.PAGAMENTO_SERVICO,
                    pacote.id
                );
            }
            break;


        // --- PASSO 5: Solicitar Coleta ---
        // Quem chama: Ponto de Destino
        case PACOTE_STATUS.A_COLETAR:
            // Validação: Destino tem saldo para o Serviço (25%)?
            const custoServico = pacote.valor_pacote_moedas * 0.25;
            const destinoPagador = await prisma.usuario.findUnique({ where: { id: pacote.id_ponto_destino }});
            
            if (destinoPagador.saldo_moedas < custoServico) {
                throw new AppError("Saldo insuficiente para contratar coleta.");
            }
            break;


        // --- PASSO 6: Aceitar Coleta ---
        // Quem chama: Ponto de Coleta
        case PACOTE_STATUS.AGUARDANDO_RETIRADA: 
            const valorTaxa = pacote.valor_pacote_moedas * 0.25;
            
            // Cobra o Serviço do Destino agora
            await transacaoService.reservarSaldo(
                pacote.id_ponto_destino,
                valorTaxa,
                TRANSACAO_TIPO.RESERVA_SERVICO,
                pacote.id
            );
            break;

        // --- PASSO 7: Coletar Pacote ---
        case PACOTE_STATUS.EM_TRANSPORTE:
            // Apenas mudança de status, sem transação
            break;
    }

    // Executa o update final no banco
    return prisma.pacote.update({
      where: { id: Number(id) },
      data,
    });
  },

  delete: (id) =>
    prisma.pacote.delete({
      where: { id: Number(id) },
    }),
};