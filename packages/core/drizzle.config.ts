import type { Config } from 'drizzle-kit';

/**
 * driver 'expo' faz o drizzle-kit gerar, alem dos .sql, um `drizzle/migrations.js`
 * que embute as migracoes no bundle. E o que permite migrar o banco dentro do
 * aparelho, sem acesso a disco e sem rede.
 */
export default {
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './drizzle',
} satisfies Config;
