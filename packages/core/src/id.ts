/**
 * Geracao de identificadores.
 *
 * Formato tipo ULID: 10 caracteres de timestamp em base32 + 16 aleatorios.
 *
 * Duas razoes para nao usar autoincrement:
 *
 * 1. Restaurar backup. Importar uma caderneta para dentro de um banco que ja tem
 *    dados colidiria em todo id inteiro. Com id textual isso nao acontece.
 * 2. Ordenacao. O prefixo de timestamp e crescente, entao ordenar por id ja
 *    devolve ordem de criacao e o indice do SQLite nao fragmenta.
 *
 * Nao usamos crypto: Hermes nao expoe `crypto.randomUUID` por padrao, e para id
 * de linha de banco local o que importa e nao colidir, nao ser imprevisivel.
 */

const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford: sem I, L, O, U
const TAMANHO_TEMPO = 10;
const TAMANHO_ALEATORIO = 16;

function codificarTempo(ms: number): string {
  let restante = ms;
  let saida = '';
  for (let i = 0; i < TAMANHO_TEMPO; i++) {
    saida = ALFABETO[restante % 32] + saida;
    restante = Math.floor(restante / 32);
  }
  return saida;
}

function sufixoAleatorio(): string {
  let saida = '';
  for (let i = 0; i < TAMANHO_ALEATORIO; i++) {
    saida += ALFABETO[Math.floor(Math.random() * 32)];
  }
  return saida;
}

/** Novo id unico e ordenavel por data de criacao. */
export function novoId(): string {
  return codificarTempo(Date.now()) + sufixoAleatorio();
}

export function ehIdValido(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.length === TAMANHO_TEMPO + TAMANHO_ALEATORIO &&
    [...id].every((c) => ALFABETO.includes(c))
  );
}
