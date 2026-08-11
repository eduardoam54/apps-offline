import type { Plano } from '@repo/core';

/**
 * Acesso a loja (compra e restauracao).
 *
 * ESTE ARQUIVO E O UNICO PONTO DE ENCAIXE DO REVENUECAT. Todo o resto do app —
 * o gate, a tela de plano, a licenca guardada — ja esta pronto e funcionando
 * contra a interface daqui. Quando a compra existir, so este arquivo muda.
 *
 * Mesmo motivo do fiado para nao estar ligado ainda: produto de compra so
 * existe depois do app publicado na Play Console — ver
 * `apps/fiado/src/loja.ts` para o passo a passo completo, que vale igual aqui.
 *
 * O contrato que o resto do app espera nao muda quando isso for ligado:
 * `comprar` e `restaurar` devolvem o plano que passou a valer, e quem grava a
 * licenca e a tela, chamando `definirPlano`.
 */

export type Oferta = {
  id: string;
  titulo: string;
  /** Preco ja formatado pela loja, com moeda local. Nunca formatar a mao. */
  preco: string;
  detalhe: string;
};

export type EstadoLoja =
  | { disponivel: false; motivo: string }
  | { disponivel: true; ofertas: Oferta[] };

const INDISPONIVEL = {
  disponivel: false,
  motivo: 'A compra ainda não está disponível nesta versão do app.',
} as const;

export async function consultarLoja(): Promise<EstadoLoja> {
  return INDISPONIVEL;
}

/** Devolve o plano que passou a valer depois da compra. */
export async function comprar(_ofertaId: string): Promise<Plano> {
  throw new Error(INDISPONIVEL.motivo);
}

/**
 * Restaura uma compra ja feita nesta conta da loja.
 *
 * Precisa existir mesmo quando a loja esta indisponivel: e o caminho de quem
 * trocou de celular ou reinstalou o app. Sem ele, a unica saida do usuario
 * seria pagar de novo.
 */
export async function restaurar(): Promise<Plano> {
  throw new Error(INDISPONIVEL.motivo);
}
