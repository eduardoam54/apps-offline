import { abrirBanco } from '@repo/core/db';

/**
 * Banco do app Orçamento.
 *
 * Instanciado uma unica vez, no modulo, de proposito: `openDatabaseSync` e
 * sincrono e barato, e ter a instancia pronta antes do primeiro render evita
 * telas piscando com estado "carregando banco".
 *
 * O nome do arquivo e definido aqui, e nao no @repo/core, porque cada um dos
 * tres apps do monorepo tem o seu banco isolado — orcamento e fiado NAO
 * compartilham dados em tempo de execucao, so o codigo do schema.
 */
export const NOME_BANCO = 'orcamento.db';

export const { db, sqlite } = abrirBanco(NOME_BANCO);
