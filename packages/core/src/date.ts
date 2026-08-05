/**
 * Datas.
 *
 * SQLite nao tem tipo de data. Guardamos texto ISO 8601 porque ele ordena
 * corretamente como string — `ORDER BY data` simplesmente funciona.
 *
 * Duas representacoes, com papeis distintos:
 *   DataISO     'AAAA-MM-DD'  — dia civil (data da venda, vencimento)
 *   InstanteISO ISO completo  — momento exato (criado_em, atualizado_em)
 *
 * Dia civil NUNCA passa por toISOString(). Esse metodo converte para UTC, e no
 * Brasil (UTC-3) uma venda lancada as 21h vira o dia seguinte. Por isso as
 * funcoes abaixo montam a string a partir dos componentes locais.
 */

/** Dia civil no formato 'AAAA-MM-DD'. */
export type DataISO = string;

/** Momento exato, ISO 8601 completo com fuso. */
export type InstanteISO = string;

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Converte um Date para dia civil usando o fuso LOCAL do aparelho. */
export function paraDataISO(d: Date): DataISO {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** Dia civil de hoje, no fuso do aparelho. */
export function hoje(): DataISO {
  return paraDataISO(new Date());
}

/** Momento atual, para campos de auditoria. */
export function agora(): InstanteISO {
  return new Date().toISOString();
}

/** Interpreta 'AAAA-MM-DD' como meia-noite LOCAL, nao UTC. */
export function deDataISO(data: DataISO): Date {
  const partes = data.split('-');
  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  return new Date(ano, mes - 1, dia);
}

export function ehDataISOValida(data: unknown): data is DataISO {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = deDataISO(data);
  return paraDataISO(d) === data;
}

/** '2026-08-05' -> '05/08/2026'. */
export function formatarDataBR(data: DataISO): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * '2026-08-05' -> 'hoje' | 'ontem' | '05/08/2026'.
 * O extrato fica muito mais legivel com os dias recentes nomeados.
 */
export function formatarDataRelativa(data: DataISO, referencia: DataISO = hoje()): string {
  const dias = diasEntre(data, referencia);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return formatarDataBR(data);
}

/**
 * Dias inteiros de `inicio` ate `fim`. Positivo quando `fim` e posterior.
 *
 * Usa meio-dia como ancora para o horario de verao nao produzir 23h ou 25h e
 * quebrar o arredondamento.
 */
export function diasEntre(inicio: DataISO, fim: DataISO): number {
  const a = deDataISO(inicio);
  const b = deDataISO(fim);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function adicionarDias(data: DataISO, dias: number): DataISO {
  const d = deDataISO(data);
  d.setDate(d.getDate() + dias);
  return paraDataISO(d);
}

/**
 * Soma meses preservando o dia quando possivel.
 *
 * 31/01 + 1 mes = 28/02 (ou 29 em ano bissexto), nao 03/03. Sem esse cuidado o
 * vencimento das parcelas de um acordo pula de mes sozinho.
 */
export function adicionarMeses(data: DataISO, meses: number): DataISO {
  const d = deDataISO(data);
  const diaDesejado = d.getDate();

  d.setDate(1);
  d.setMonth(d.getMonth() + meses);

  const ultimoDiaDoMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaDesejado, ultimoDiaDoMes));

  return paraDataISO(d);
}

/** Primeiro e ultimo dia civil do mes de `data`. Base dos relatorios mensais. */
export function limitesDoMes(data: DataISO): { inicio: DataISO; fim: DataISO } {
  const d = deDataISO(data);
  const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { inicio: paraDataISO(inicio), fim: paraDataISO(fim) };
}
