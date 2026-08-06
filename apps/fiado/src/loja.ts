import type { Plano } from '@repo/core';

/**
 * Acesso a loja (compra e restauracao).
 *
 * ESTE ARQUIVO E O UNICO PONTO DE ENCAIXE DO REVENUECAT. Todo o resto do app —
 * o gate, a tela de plano, a licenca guardada — ja esta pronto e funcionando
 * contra a interface daqui. Quando a compra existir, so este arquivo muda.
 *
 * Por que ainda nao esta ligado, e nao e pressa nem preguica: um produto de
 * compra so passa a existir depois de cadastrado na Play Console, e a Play
 * Console so aceita cadastro depois do app publicado. O RevenueCat leria uma
 * lista vazia hoje. A integracao nao teria como ser testada — teria como, no
 * maximo, ser escrita e ficar por conferir, que e a pior das situacoes num
 * caminho que mexe com o dinheiro do usuario.
 *
 * O QUE FALTA, na ordem:
 *
 *   1. publicar o app (mesmo em teste fechado) e criar os produtos na Play
 *      Console: assinatura mensal e desbloqueio vitalicio
 *   2. criar o projeto no RevenueCat e pegar a chave publica de Android
 *   3. `npm install react-native-purchases --workspace fiado`
 *   4. guardar a chave em `app.json` -> `expo.extra.revenueCatAndroidKey` e ler
 *      com `expo-constants`. Sem chave, `consultarLoja` deve continuar
 *      devolvendo indisponivel em vez de quebrar o app
 *   5. trocar os corpos das tres funcoes abaixo por `Purchases.getOfferings`,
 *      `Purchases.purchasePackage` e `Purchases.restorePurchases`
 *
 * O contrato que o resto do app espera nao muda em nenhum desses passos:
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
