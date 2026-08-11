/**
 * Entrada de @repo/core/db — depende de modulo nativo (expo-sqlite).
 * So pode ser importado de dentro do app, nunca de um teste em Node.
 */
export * from './backup';
export * from './client';
export * from './consultas';
export * from './migrate';
export * from './repos/acordo';
export * from './repos/cliente';
export * from './repos/config';
export * from './repos/orcamento';
export * from './repos/pagamento';
export * from './repos/produto';
export * from './repos/venda';
export * from './repos/veiculo';
export * from './schema';
export * from './tipos';
export * from './viva';
