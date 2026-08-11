/**
 * Regras do plano gratuito e do plano pago.
 *
 * Logica pura de proposito: o que o paywall libera e uma decisao de produto que
 * precisa ser lida, discutida e testada num arquivo so. Espalhada por dentro das
 * telas, ela vira um `if` esquecido que bloqueia alguem que pagou.
 *
 * A premissa que ordena tudo aqui: O PAYWALL NUNCA INTERROMPE O EXPEDIENTE.
 * Lancar fiado, receber pagamento, ver saldo, cobrar no WhatsApp e fazer backup
 * funcionam igual nos dois planos, para sempre. O comerciante precisa conseguir
 * usar o app de verdade — durante meses, se quiser — antes de decidir pagar.
 */

/**
 * Quantos clientes cabem no plano gratuito.
 *
 * O limite e de CLIENTES, nunca de lancamentos. Limitar lancamento pararia o
 * comerciante no meio do balcao, com fila na frente — o app viraria um estorvo
 * exatamente no momento em que deveria estar provando que serve.
 */
export const LIMITE_CLIENTES_GRATIS = 15;

/** Quando o aviso de "esta acabando" comeca a aparecer. */
const VAGAS_PARA_AVISAR = 3;

export type Plano = 'gratis' | 'pago';

/**
 * O que o plano gratuito NAO inclui.
 *
 * Backup e restauracao ficam FORA desta lista de proposito, contrariando o
 * plano original. O comerciante so larga o caderno de papel quando acredita que
 * nao vai perder a caderneta; cobrar por "nao perder seus dados" envenena
 * justamente a confianca que faz ele adotar o app. Pior: um dia ele troca de
 * celular, e restaurar precisa funcionar mesmo que a assinatura tenha vencido —
 * senao o app estaria segurando o historico dele como refem.
 */
export type RecursoPago = 'exportar';

export function recursoLiberado(_recurso: RecursoPago, plano: Plano): boolean {
  return plano === 'pago';
}

/**
 * Se cabe mais um cliente.
 *
 * Vale so para CADASTRAR. Quem ja esta acima do limite — restaurou um backup de
 * 40 clientes, ou pagou e depois deixou vencer — continua lendo, editando,
 * lancando e recebendo normalmente. Bloquear o acesso ao dado que ja e dele
 * seria sequestro, nao monetizacao.
 *
 * A valvula de escape existe e e a mesma de sempre: arquivar um cliente que nao
 * compra mais abre vaga, porque arquivado nao conta como ativo.
 */
export function podeCadastrarCliente(plano: Plano, clientesAtivos: number): boolean {
  return plano === 'pago' || clientesAtivos < LIMITE_CLIENTES_GRATIS;
}

/** Quantos cadastros ainda cabem. `null` quando nao ha limite. */
export function vagasRestantes(plano: Plano, clientesAtivos: number): number | null {
  if (plano === 'pago') return null;
  return Math.max(0, LIMITE_CLIENTES_GRATIS - clientesAtivos);
}

export type AvisoDeLimite = 'nenhum' | 'perto' | 'cheio';

/**
 * O que a lista de clientes deve mostrar sobre o limite.
 *
 * O aviso aparece ANTES de encher. Descobrir o limite so na hora de cadastrar,
 * com o cliente esperando do outro lado do balcao, e o jeito mais rapido de
 * transformar uma cobranca legitima em avaliacao de uma estrela.
 */
export function avisoDeLimite(plano: Plano, clientesAtivos: number): AvisoDeLimite {
  const vagas = vagasRestantes(plano, clientesAtivos);
  if (vagas == null) return 'nenhum';
  if (vagas === 0) return 'cheio';
  return vagas <= VAGAS_PARA_AVISAR ? 'perto' : 'nenhum';
}

/**
 * Regras do app orcamento.
 *
 * O limite aqui e de ORCAMENTOS NO MES, e nao de clientes: cadastrar cliente e
 * so o meio, o orcamento e que e o produto. Reinicia todo mes de proposito —
 * diferente do limite de clientes do fiado (que e cumulativo), aqui o
 * profissional que teve um mes cheio nao fica bloqueado no mes seguinte.
 */
export const LIMITE_ORCAMENTOS_GRATIS_MES = 3;

/** Se cabe mais um orcamento neste mes. Vale so para CRIAR — orcamento ja criado continua acessivel. */
export function podeCriarOrcamento(plano: Plano, orcamentosNoMes: number): boolean {
  return plano === 'pago' || orcamentosNoMes < LIMITE_ORCAMENTOS_GRATIS_MES;
}

/** Quantos orcamentos ainda cabem neste mes. `null` quando nao ha limite. */
export function orcamentosRestantesNoMes(plano: Plano, orcamentosNoMes: number): number | null {
  if (plano === 'pago') return null;
  return Math.max(0, LIMITE_ORCAMENTOS_GRATIS_MES - orcamentosNoMes);
}

// ---------------------------------------------------------------------------
// Regras do app veiculo
//
// O limite aqui e de VEICULOS, nao de lancamentos nem de uso:
//   - Gratuito: 1 veiculo, historico completo, todos os alertas.
//   - Pago (vitalicio): multiplos veiculos, relatorio de custos em PDF, backup.
//
// O motivo e diferente do fiado (limite de clientes) e do orcamento (limite
// mensal): quem tem 1 carro usa o app inteiro de graca e vira divulgador.
// Quem tem frota (2-5 veiculos) paga sem reclamar porque o ganho e imediato.
//
// Backup e pago no veiculo, ao contrario do fiado e orcamento. Motivo: dados
// do veiculo sao historico pessoal — nao financeiro, nao divida. A perda e
// inconveniente, nao critica. Cobrar por backup aqui nao e "sequestrar dados",
// e diferenciar o plano pago de forma tangivel para quem tem 1 veiculo.
// ---------------------------------------------------------------------------

export const LIMITE_VEICULOS_GRATIS = 1;

/** Se cabe mais um veiculo. Vale so para CADASTRAR. */
export function podeCadastrarVeiculo(plano: Plano, veiculosAtivos: number): boolean {
  return plano === 'pago' || veiculosAtivos < LIMITE_VEICULOS_GRATIS;
}

/** Backup do veiculo e recurso do plano pago. */
export function backupVeiculoLiberado(plano: Plano): boolean {
  return plano === 'pago';
}
