/**
 * Entrada de @repo/core/db — depende de modulo nativo (expo-sqlite).
 * So pode ser importado de dentro do app, nunca de um teste em Node.
 */
export * from './client';
export * from './migrate';
export * from './schema';
