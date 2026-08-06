import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/**
 * Tipo de banco aceito pelos repositorios.
 *
 * Deliberadamente frouxo. Os repositorios precisam rodar sobre dois drivers
 * diferentes do Drizzle:
 *
 *   - `expo-sqlite`     dentro do app, no aparelho
 *   - `better-sqlite3`  nos testes, em memoria no Node
 *
 * Os dois implementam a mesma API de consulta, mas seus tipos concretos nao sao
 * compativeis entre si. Amarrar os repositorios a um deles significaria ou nao
 * poder testar contra SQLite de verdade, ou duplicar cada funcao. Nenhuma das
 * duas coisas vale o ganho de tipagem aqui — o schema, que e onde erro de tipo
 * de fato acontece, continua totalmente tipado.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type BancoSQLite = BaseSQLiteDatabase<any, any, any>;
