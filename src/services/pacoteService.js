import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { PACOTE_STATUS, TRANSACAO_TIPO,  } from "../utils/constants.js";
import { transacaoService } from "../services/transacaoService.js"

const TRANSICOES_VALIDAS = {
  [PACOTE_STATUS.DISPONIVEL]:           [PACOTE_STATUS.AGUARDANDO_APROVACAO],
  [PACOTE_STATUS.AGUARDANDO_APROVACAO]: [PACOTE_STATUS.AGUARDANDO_COLETA, PACOTE_STATUS.DISPONIVEL], // Aprovar ou Recusar
  [PACOTE_STATUS.AGUARDANDO_COLETA]:    [PACOTE_STATUS.A_COLETAR, PACOTE_STATUS.DESTINADO, PACOTE_STATUS.DISPONIVEL], // Pedir coleta, Entregar direto ou Cancelar Destinação
  [PACOTE_STATUS.A_COLETAR]:            [PACOTE_STATUS.AGUARDANDO_RETIRADA, PACOTE_STATUS.AGUARDANDO_COLETA], // Aceitar ou Cancelar
  [PACOTE_STATUS.AGUARDANDO_RETIRADA]:  [PACOTE_STATUS.EM_TRANSPORTE, PACOTE_STATUS.A_COLETAR], // Pegou ou Cancelou
  [PACOTE_STATUS.EM_TRANSPORTE]:        [PACOTE_STATUS.DESTINADO, PACOTE_STATUS.A_COLETAR], // Entregou ou Cancelou
  [PACOTE_STATUS.DESTINADO]:            [] // Fim da linha
};

export const pacoteService = {
  findAll: () => prisma.pacote.findMany({
    include: {
      material: true,
      pontoDescarte: true
    },
    orderBy: { data_criacao: 'desc' }
  }),

  findById: (id) => prisma.pacote.findUnique({ 
    where: { id: Number(id) },
    include: { pontoDescarte: true, pontoColeta: true, pontoDestino: true }
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

    if (novoStatus && novoStatus !== pacote.status) {
      const transicoesPermitidas = TRANSICOES_VALIDAS[pacote.status];

      if (!transicoesPermitidas || !transicoesPermitidas.includes(novoStatus)) {
          throw new AppError(`Não é permitido mudar de '${pacote.status}' para '${novoStatus}'. Sequência inválida.`);
      }
    };

    let dadosAtualizacao = { ...data };

    switch (novoStatus) {

      case PACOTE_STATUS.DISPONIVEL:
        if (pacote.status === PACOTE_STATUS.AGUARDANDO_COLETA) {
            // Se já tinha dinheiro preso, devolve.
            await transacaoService.realizarEstorno(
                pacote.id_ponto_destino,
                pacote.valor_pacote_moedas,
                TRANSACAO_TIPO.ESTORNO_MATERIAL,
                pacote.id
            );
            
            // Limpa quem era o destino, pois ele desistiu
            dadosAtualizacao.id_ponto_destino = null;
        }
        // Se veio de "Aguardando Aprovação" (Recusa simples), não precisa estornar nada
        break;
        
      // --- PASSO 2: Solicitar Destinação ---
      // Quem chama: Ponto de Destino
      case PACOTE_STATUS.AGUARDANDO_APROVACAO:
        if (!data.id_ponto_destino) throw new AppError("Obrigatório informar id_ponto_destino.");
            
        const usuarioDestino = await prisma.usuario.findUnique({ where: { id: data.id_ponto_destino }});

        if (usuarioDestino.saldo_moedas < pacote.valor_pacote_moedas) {
            throw new AppError("Saldo insuficiente para solicitar este pacote.");
        }

        break;

      // --- PASSO 3: Aprovar Destinação ---
      // Quem chama: Ponto de Descarte
      case PACOTE_STATUS.AGUARDANDO_COLETA:
        // Se veio do passo 2, cobra o Material agora
        if (pacote.status === PACOTE_STATUS.AGUARDANDO_APROVACAO) {

          if (!pacote.id_ponto_destino) throw new AppError("Pacote sem destino definido.");
          
          await transacaoService.reservarSaldo(
            pacote.id_ponto_destino,
            pacote.valor_pacote_moedas,
            TRANSACAO_TIPO.RESERVA_MATERIAL,
            pacote.id
          );
        }

        break;

      // --- PASSO 5: Solicitar Coleta ---
      // Quem chama: Ponto de Destino
      case PACOTE_STATUS.A_COLETAR:
        // --- CANCELAMENTO DO SERVIÇO DE COLETA ---
        if (pacote.status === PACOTE_STATUS.AGUARDANDO_RETIRADA) {
          const valorServico = pacote.valor_coleta_moedas || (pacote.valor_pacote_moedas * 0.25);
          
          await transacaoService.realizarEstorno(
              pacote.id_ponto_destino, // Devolve para quem pagou (Destino)
              valorServico,
              TRANSACAO_TIPO.ESTORNO_SERVICO,
              pacote.id
          );

          // Limpa o coletor, para deixar outro pegar
          dadosAtualizacao.id_ponto_coleta = null;
          dadosAtualizacao.valor_coleta_moedas = null;
        }

        const idPagador = pacote.id_ponto_destino;
        if (!idPagador) throw new AppError("Pacote sem destino pagador.");

        const custoEstimado = pacote.valor_pacote_moedas * 0.25;
        const pagador = await prisma.usuario.findUnique({ where: { id: idPagador }});
        
        if (pagador.saldo_moedas < custoEstimado) {
          throw new AppError("Saldo insuficiente para cobrir o serviço de coleta.");
        }

        break;

      // --- PASSO 6: Aceitar Coleta ---
      // Quem chama: Ponto de Coleta
      case PACOTE_STATUS.AGUARDANDO_RETIRADA: 
        if (!data.id_ponto_coleta) throw new AppError("Obrigatório informar id_ponto_coleta.");
              
        const valorTaxa = pacote.valor_pacote_moedas * 0.25;

        await transacaoService.reservarSaldo(
            pacote.id_ponto_destino,
            valorTaxa,
            TRANSACAO_TIPO.RESERVA_SERVICO,
            pacote.id
        );

        dadosAtualizacao.valor_coleta_moedas = valorTaxa;
        break;

      // --- PASSO 7: Coletar Pacote ---
      // Quem chama: Ponto de Coleta
      case PACOTE_STATUS.EM_TRANSPORTE:
          // Apenas mudança de status, sem transação
          dadosAtualizacao.data_coleta = new Date();
          break;

      // --- PASSO 4 OU 8: Finalizar (DESTINADO) ---
      case PACOTE_STATUS.DESTINADO:
        // A. Paga o Material (Sempre acontece)
        await transacaoService.liberarPagamento(
          pacote.id_ponto_descarte,
          pacote.valor_pacote_moedas,
          TRANSACAO_TIPO.PAGAMENTO_MATERIAL,
          pacote.id
        );

        // B. Paga o Coletor (Se houver)
        // Verifica se tem coletor definido E valor de coleta registrado (do passo 6)
        if (pacote.id_ponto_coleta && pacote.valor_coleta_moedas) {
            await transacaoService.liberarPagamento(
                pacote.id_ponto_coleta,
                pacote.valor_coleta_moedas,
                TRANSACAO_TIPO.PAGAMENTO_SERVICO,
                pacote.id
            );
        } 
        // Caso de fallback: Se tiver coletor mas valor for null, calcula na hora
        else if (pacote.id_ponto_coleta) {
            const valorCalculado = pacote.valor_pacote_moedas * 0.25;
            await transacaoService.liberarPagamento(
                pacote.id_ponto_coleta,
                valorCalculado,
                TRANSACAO_TIPO.PAGAMENTO_SERVICO,
                pacote.id
            );
        }

        dadosAtualizacao.data_destino = new Date();
        break;

    }

    // Executa o update final no banco
    return prisma.pacote.update({
      where: { id: Number(id) },
      data: dadosAtualizacao,
    });
  },

  delete: (id) =>
    prisma.pacote.delete({
      where: { id: Number(id) },
    }),
};