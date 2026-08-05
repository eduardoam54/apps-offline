import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migracoes from '../../drizzle/migrations';
import type { Banco } from './client';

/**
 * Aplica as migracoes pendentes na abertura do app.
 *
 * As migracoes vao embutidas no bundle (via babel-plugin-inline-import), entao
 * isso roda sem rede e sem acesso a disco — coerente com a promessa de o app
 * funcionar 100% offline.
 *
 * Devolve { success, error }. O chamador PRECISA tratar o erro: banco que nao
 * migrou e banco que nao pode ser usado, e num app de caderneta seguir adiante
 * silenciosamente arriscaria mostrar saldo errado.
 */
export function useMigracoes(db: Banco) {
  return useMigrations(db, migracoes);
}

export { migracoes };
