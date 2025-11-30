import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { PACOTE_STATUS, TRANSACAO_TIPO,  } from "../utils/constants.js";
import { transacaoService } from "../services/transacaoService.js";
import { notificacaoService} from "../services/notificacaoService.js";

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
  find: () => {
    return prisma.pacote.findMany()
  },
  
  findAll: (userId) => {
    return prisma.pacote.findMany({
      where: {
        OR: [
          // Cenários Públicos
          { status: PACOTE_STATUS.DISPONIVEL },
          { status: PACOTE_STATUS.A_COLETAR },
          
          // Cenários Privados (Onde eu estou envolvido)
          { id_ponto_descarte: userId },
          { id_ponto_destino: userId },
          { id_ponto_coleta: userId }
        ]
      },
      include: {
        material: true,
        pontoDescarte: true,
        pontoColeta: true,
        pontoDestino: true,
      },
      orderBy: { data_criacao: 'desc' }
    });
  },

  findMy: (userId) => {
    const id = Number(userId);

    return prisma.pacote.findMany({
      where: {
        OR: [
          // Cenários Privados (Onde eu estou envolvido)
          { id_ponto_descarte: id },
          { id_ponto_destino: id },
          { id_ponto_coleta: id }
        ]
      },
      include: {
        material: true,
        pontoDescarte: true,
        pontoColeta: true,
        pontoDestino: true,
      },
      orderBy: { data_criacao: 'desc' }
    });
  },

  findById: (id) => prisma.pacote.findUnique({ 
    where: { id: Number(id) },
    include: { material: true, pontoDescarte: true, pontoColeta: true, pontoDestino: true }
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
        titulo: data.titulo,
        descricao: data.descricao,
        imagemUrl: data.imagemUrl,
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

    const pacoteAtualizado = await prisma.pacote.update({
      where: { id: Number(id) },
      data,
    });

    // 3. LÓGICA DE NOTIFICAÇÃO (Pós-Update)
    const userIdLogado = data.quem_alterou;

    console.log("--- DEBUG NOTIFICAÇÃO ---");
    console.log("Status Antigo:", pacote.status);
    console.log("Novo Status:", novoStatus);
    console.log("Quem alterou:", userIdLogado);

    // --- CENÁRIO: REJEIÇÃO (Faltava isso) ---
    // Se saiu de AGUARDANDO_APROVACAO para DISPONIVEL, foi uma rejeição do Dono.
    if (novoStatus === PACOTE_STATUS.DISPONIVEL && pacoteAntigo.status === PACOTE_STATUS.AGUARDANDO_APROVACAO) {
      // O id_ponto_destino foi limpo no update, então usamos o pacoteAntigo
      if (pacoteAntigo.id_ponto_destino) {
          await notificacaoService.create({
              id_usuario: pacoteAntigo.id_ponto_destino, // Avisa quem pediu
              id_remetente: userIdLogado,
              id_pacote: pacoteAntigo.id,
              tipo: "AVISO", // Vermelho/Preto
              titulo: "Solicitação de Destinação Recusada",
              mensagem: `Sua solicitação para destinar o pacote #${pacoteAntigo.titulo} foi recusada pelo ponto de descarte.`
          });
      }
    }

    // CENÁRIO A: Alguém pediu para comprar (AGUARDANDO_APROVACAO)
    // Notificar o Dono (Descarte)
    if (novoStatus === PACOTE_STATUS.AGUARDANDO_APROVACAO) {
      console.log(">>> Entrou no IF de Solicitação!");

      await notificacaoService.create({
          id_usuario: pacote.id_ponto_descarte, // Dono recebe
          id_remetente: userIdLogado, // Quem pediu
          id_pacote: pacote.id,
          tipo: "SOLICITACAO",
          titulo: "Solicitação de Destinação Recebida",
          mensagem: `O usuário solicitou permissão para destinar o pacote #${pacote.id}: ${pacote.titulo}.`
      });
    }

    // CENÁRIO B: Dono Aprovou (AGUARDANDO_COLETA)
    // Notificar o Interessado (Destino)
    if (novoStatus === PACOTE_STATUS.AGUARDANDO_COLETA && pacote.status === PACOTE_STATUS.AGUARDANDO_APROVACAO) {
      console.log(">>> Entrou no IF de Aprovação!");

      await notificacaoService.create({
          id_usuario: pacote.id_ponto_destino,
          id_remetente: pacote.id_ponto_descarte,
          id_pacote: pacote.id,
          tipo: "CONFIRMACAO",
          titulo: "Confirmação de Destinação Recebida",
          mensagem: `O pacote é seu! O ponto de descarte aceitou sua soliicitação para destinar o pacote #${pacote.id}: ${pacote.titulo}.`
      });
    }

    // CENÁRIO C: Motorista se oferece para coletar (AGUARDANDO_RETIRADA)
    // Quem recebe: O Ponto de Destino (que precisa aprovar ou acompanhar)
    if (novoStatus === PACOTE_STATUS.AGUARDANDO_RETIRADA) {
      console.log(">>> Entrou no IF de Coleta Terceirizada");

      // Avisa o Destino (Quem paga o frete) -> Action Button
      await notificacaoService.create({
        id_usuario: pacoteAtualizado.id_ponto_destino,
        id_remetente: userIdLogado, // Motorista
        id_pacote: pacoteAtualizado.id,
        tipo: "CONFIRMACAO", 
        titulo: "Motorista Encontrado",
        mensagem: `Um motorista aceitou sua oferta de coleta para o pacote #${pacote.id}: ${pacote.titulo}.`
    });

    // Avisa o Dono (Descarte) -> Apenas Info
    await notificacaoService.create({
        id_usuario: pacoteAtualizado.id_ponto_descarte,
        id_remetente: userIdLogado,
        id_pacote: pacoteAtualizado.id,
        tipo: "AVISO", // Info
        titulo: "Coleta Agendada",
        mensagem: `A coleta do seu pacote #${pacote.id}: ${pacote.titulo} será feita por um motorista parceiro.`
    });
    }

    // CENÁRIO D: Motorista pegou o pacote (EM_TRANSPORTE)
    // Quem recebe: O Ponto de Destino (para se preparar)
    if (novoStatus === PACOTE_STATUS.EM_TRANSPORTE) {
      console.log(">>> Entrou no IF de Transporte!");

      await notificacaoService.create({
          id_usuario: pacote.id_ponto_destino,
          id_remetente: userIdLogado,
          id_pacote: pacote.id,
          tipo: "AVISO", // Informativo
          titulo: "Pacote em Transporte",
          mensagem: `O pacote #${pacote.titulo || pacote.id} foi coletado e está a caminho!`
      });
    }

    // CENÁRIO E: Pacote Entregue (DESTINADO)
    // Quem recebe: O Ponto de Descarte (para saber que finalizou) e o Coletor
    if (novoStatus === PACOTE_STATUS.DESTINADO) {
      console.log(">>> Entrou no IF de Destinação!");
    
      await notificacaoService.create({
          id_usuario: pacote.id_ponto_descarte,
          id_remetente: userIdLogado, // Quem finalizou (Destino)
          id_pacote: pacote.id,
          tipo: "CONFIRMACAO", // Verde
          titulo: "Processo Finalizado",
          mensagem: `Seu pacote #${pacote.titulo || pacote.id} chegou ao destino final. O valor foi creditado!`
      });

      // Se tiver coletor, avisa ele também
      if (pacote.id_ponto_coleta) {
            await notificacaoService.create({
              id_usuario: pacote.id_ponto_coleta,
              id_remetente: userIdLogado,
              id_pacote: pacote.id,
              tipo: "CONFIRMACAO",
              titulo: "Entrega Confirmada",
              mensagem: `A entrega do pacote #${pacote.id}: ${pacote.titulo} foi confirmada pelo destino. Seu pagamento foi liberado.`
          });
      }
    }

    return pacoteAtualizado
  },

  delete: (id) =>
    prisma.pacote.delete({
      where: { id: Number(id) },
    }),

};