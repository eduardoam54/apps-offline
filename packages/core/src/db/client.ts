import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

/**
 * Abre o banco local do app.
 *
 * O nome vem por parametro porque este pacote e compartilhado pelos tres apps do
 * monorepo e cada um tem o seu arquivo isolado. Nao existe dado trafegando entre
 * apps — so o codigo de acesso e comum.
 *
 * `enableChangeListener` e obrigatorio para o `useConsultaViva` (ver viva.ts):
 * e ele que emite o evento de tabela alterada que faz a lista de clientes se
 * atualizar sozinha quando uma venda e lancada, sem recarregar a tela na mao.
 */
export function abrirBanco(nomeArquivo: string) {
  const sqlite = openDatabaseSync(nomeArquivo, { enableChangeListener: true });

  // O SQLite desliga chaves estrangeiras por padrao. Sem isso, `onDelete:
  // cascade` do schema seria silenciosamente ignorado e itens de venda ficariam
  // orfaos no banco.
  sqlite.execSync('PRAGMA foreign_keys = ON;');

  // WAL: leitura nao trava durante escrita. Numa lista longa de clientes sendo
  // lida enquanto o comerciante lanca uma venda, evita travada de interface.
  sqlite.execSync('PRAGMA journal_mode = WAL;');

  return { db: drizzle(sqlite, { schema }), sqlite };
}

export type Banco = ReturnType<typeof abrirBanco>['db'];
export type BancoBruto = SQLiteDatabase;
export { schema };
