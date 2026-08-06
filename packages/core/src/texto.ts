/**
 * Normalizacao de texto para busca.
 *
 * O `LIKE` do SQLite so e insensivel a maiusculas em ASCII: procurar "joao" nao
 * encontra "João", e procurar "JOSE" nao encontra "José". Num app brasileiro
 * isso e inaceitavel — metade dos nomes de cliente tem acento.
 *
 * A busca acontece em memoria sobre a lista ja carregada, e nao em SQL. Uma
 * caderneta de fiado tem dezenas ou poucas centenas de clientes; filtrar isso em
 * JavaScript custa nada e evita ter que manter uma coluna espelho normalizada
 * sincronizada a cada gravacao.
 */

/** "João da Silva" -> "joao da silva". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Verdadeiro se `termo` aparece em qualquer um dos campos, ignorando acento. */
export function combinaComBusca(termo: string, ...campos: (string | null | undefined)[]): boolean {
  const alvo = normalizarTexto(termo);
  if (alvo === '') return true;

  return campos.some((campo) => campo != null && normalizarTexto(campo).includes(alvo));
}
