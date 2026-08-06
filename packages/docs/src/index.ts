/**
 * Entrada principal de @repo/docs — APENAS logica pura.
 *
 * Monta mensagem, HTML e CSV a partir de dados, sem tocar em modulo nativo.
 * Assim tudo aqui roda no vitest em Node puro.
 *
 * Gerar o PDF e gravar o arquivo vivem no subcaminho `@repo/docs/arquivo`.
 */
export * from './whatsapp';
export * from './html';
export * from './extrato';
export * from './relatorio';
export * from './csv';
export * from './nome-arquivo';
