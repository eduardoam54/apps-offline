import { normalizarTexto } from '@repo/core';

/**
 * Nome dos arquivos exportados.
 *
 * O nome importa mais do que parece: o arquivo quase sempre sai do app pelo
 * WhatsApp, e o que o destinatario ve antes de decidir abrir e exatamente esta
 * string. "extrato-joao-da-silva-2026-08-06.pdf" e um documento;
 * "a1b2c3d4.pdf" e um anexo suspeito.
 */

/**
 * "João da Silva" -> "joao-da-silva".
 *
 * Acento e espaco viram problema em alguns gerenciadores de arquivo do Android
 * e em anexo de e-mail, entao o nome sai reduzido a a-z, 0-9 e hifen. Se sobrar
 * nada — nome escrito so com emoji, por exemplo — devolve string vazia e quem
 * chama decide o rotulo.
 */
export function paraNomeDeArquivo(texto: string): string {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Nome com data no fim: ordenavel na pasta e obvio na lista de downloads. */
export function nomeDoArquivo(base: string, extensao: string, quando = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const data = `${quando.getFullYear()}-${p(quando.getMonth() + 1)}-${p(quando.getDate())}`;
  return `${base}-${data}.${extensao}`;
}
