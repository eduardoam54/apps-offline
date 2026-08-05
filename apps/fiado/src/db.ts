import { abrirBanco } from '@repo/core/db';

/**
 * Banco do app Fiado.
 *
 * Instanciado uma unica vez, no modulo, de proposito: `openDatabaseSync` e
 * sincrono e barato, e ter a instancia pronta antes do primeiro render evita
 * telas piscando com estado "carregando banco".
 *
 * O nome do arquivo e definido aqui, e nao no @repo/core, porque cada um dos
 * tres apps do monorepo tem o seu banco isolado.
 */
export const NOME_BANCO = 'fiado.db';

export const { db, sqlite } = abrirBanco(NOME_BANCO);
