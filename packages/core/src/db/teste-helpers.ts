import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as schema from './schema';
import type { BancoSQLite } from './tipos';

/**
 * Banco em memoria para testes.
 *
 * Aplica exatamente os mesmos arquivos .sql que o drizzle-kit gerou e que o app
 * roda no aparelho. Isso e o ponto: testar contra o schema real, com as chaves
 * estrangeiras e os indices de verdade, e nao contra uma reproducao escrita a
 * mao que pode divergir sem ninguem perceber.
 *
 * `better-sqlite3` e sincrono e `expo-sqlite` e assincrono, mas os construtores
 * de consulta do Drizzle sao `await`-aveis nos dois casos — por isso os
 * repositorios funcionam identicos aqui e no app.
 */
export function bancoDeTeste(): BancoSQLite {
  const sqlite = new Database(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const pastaMigracoes = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');
  const arquivos = readdirSync(pastaMigracoes)
    .filter((nome) => nome.endsWith('.sql'))
    .sort();

  if (arquivos.length === 0) {
    throw new Error('bancoDeTeste: nenhuma migracao encontrada. Rode `npm run db:generate`.');
  }

  for (const arquivo of arquivos) {
    const conteudo = readFileSync(join(pastaMigracoes, arquivo), 'utf8');
    for (const comando of conteudo.split('--> statement-breakpoint')) {
      const limpo = comando.trim();
      if (limpo !== '') sqlite.exec(limpo);
    }
  }

  return drizzle(sqlite, { schema }) as unknown as BancoSQLite;
}
