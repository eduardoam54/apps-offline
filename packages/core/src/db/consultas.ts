import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import type { Centavos } from '../money';
import { cliente, pagamento, venda } from './schema';
import type { BancoSQLite } from './tipos';

/**
 * Consultas de leitura.
 *
 * Devolvem o CONSTRUTOR da query, nao o resultado, para poderem ser passadas ao
 * `useLiveQuery` do Drizzle — e ele que faz a tela se atualizar sozinha quando
 * uma venda e lancada em outro lugar do app.
 */

/**
 * Saldo do cliente, como expressao SQL.
 *
 * DUAS ARMADILHAS ESTAO EVITADAS AQUI. Nenhuma das duas da erro — as duas
 * simplesmente devolvem o numero errado.
 *
 * 1. Subconsulta, nunca JOIN. Um `LEFT JOIN venda` + `LEFT JOIN pagamento` na
 *    mesma consulta produz o produto cartesiano: um cliente com 3 vendas e 2
 *    pagamentos vira 6 linhas, e `SUM` conta cada venda duas vezes e cada
 *    pagamento tres. O saldo sai inflado sem nenhum aviso.
 *
 * 2. A correlacao `cliente.id` e TEXTO SQL literal, e nao `${cliente.id}`
 *    interpolado. Ao executar, o Drizzle renderiza a coluna interpolada sem
 *    qualificar a tabela — vira so `"id"`. Dentro da subconsulta isso casa com
 *    `venda.id`, que tambem existe, e a condicao vira `v.cliente_id = v.id`:
 *    nunca verdadeira, soma sempre zero. Escrever `cliente.id` como texto
 *    garante que a referencia aponta para a tabela de fora.
 */
const expressaoSaldo = sql<number>`(
  coalesce((
    select sum(v.valor_centavos) from venda v
    where v.cliente_id = cliente.id and v.deletado_em is null
  ), 0)
  -
  coalesce((
    select sum(p.valor_centavos) from pagamento p
    where p.cliente_id = cliente.id and p.deletado_em is null
  ), 0)
)`;

const expressaoUltimaCompra = sql<string | null>`(
  select max(v.data) from venda v
  where v.cliente_id = cliente.id and v.deletado_em is null
)`;

const expressaoUltimoPagamento = sql<string | null>`(
  select max(p.data) from pagamento p
  where p.cliente_id = cliente.id and p.deletado_em is null
)`;

export type ClienteComSaldo = {
  id: string;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  fotoUri: string | null;
  limiteCreditoCentavos: number | null;
  saldoCentavos: Centavos;
  ultimaCompra: string | null;
  ultimoPagamento: string | null;
};

/**
 * Todos os clientes ativos com o saldo calculado, do maior devedor para o menor.
 *
 * Traz a lista inteira sem filtro de busca: a filtragem por nome acontece em
 * memoria (ver texto.ts), porque o LIKE do SQLite ignora acentuacao.
 */
export function consultaClientesComSaldo(db: BancoSQLite) {
  return db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      apelido: cliente.apelido,
      telefone: cliente.telefone,
      fotoUri: cliente.fotoUri,
      limiteCreditoCentavos: cliente.limiteCreditoCentavos,
      saldoCentavos: expressaoSaldo,
      ultimaCompra: expressaoUltimaCompra,
      ultimoPagamento: expressaoUltimoPagamento,
    })
    .from(cliente)
    .where(isNull(cliente.deletadoEm))
    .orderBy(desc(expressaoSaldo), asc(cliente.nome));
}

/**
 * Total a receber. E o numero grande da tela inicial.
 *
 * Soma o saldo dos clientes ATIVOS. Divida de cliente arquivado nao entra na
 * conta — arquivar e dizer "esse nao esta mais na minha caderneta". O historico
 * dele continua guardado e volta inteiro se for reativado, mas manter o valor no
 * total faria o comerciante cobrar alguem que ele mesmo tirou da lista.
 */
export function consultaTotalAReceber(db: BancoSQLite) {
  return db
    .select({ total: sql<number>`coalesce(sum(${expressaoSaldo}), 0)` })
    .from(cliente)
    .where(isNull(cliente.deletadoEm));
}

export function consultaVendasDoCliente(db: BancoSQLite, clienteId: string) {
  return db
    .select()
    .from(venda)
    .where(and(eq(venda.clienteId, clienteId), isNull(venda.deletadoEm)))
    .orderBy(desc(venda.data), desc(venda.criadoEm));
}

export function consultaPagamentosDoCliente(db: BancoSQLite, clienteId: string) {
  return db
    .select()
    .from(pagamento)
    .where(and(eq(pagamento.clienteId, clienteId), isNull(pagamento.deletadoEm)))
    .orderBy(desc(pagamento.data), desc(pagamento.criadoEm));
}

/** Saldo de um cliente so, para quando nao ha lista carregada. */
export async function saldoDoCliente(db: BancoSQLite, clienteId: string): Promise<Centavos> {
  const linhas = await db
    .select({ saldo: expressaoSaldo })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  return (linhas[0] as { saldo: number } | undefined)?.saldo ?? 0;
}

export async function totalAReceber(db: BancoSQLite): Promise<Centavos> {
  const linhas = await consultaTotalAReceber(db);
  return (linhas[0] as { total: number } | undefined)?.total ?? 0;
}

/** Um item do extrato — venda ou pagamento — ja unificado para exibir na tela. */
export type ItemExtrato = {
  id: string;
  tipo: 'venda' | 'pagamento';
  data: string;
  valorCentavos: Centavos;
  descricao: string | null;
  forma: string | null;
  criadoEm: string;
};

/**
 * Junta vendas e pagamentos numa linha do tempo unica.
 *
 * A juncao e feita em JavaScript e nao com UNION em SQL. As duas tabelas tem
 * colunas diferentes, e um UNION exigiria preencher coluna com null dos dois
 * lados so para os formatos baterem — mais fragil e menos legivel do que
 * ordenar duas listas pequenas aqui.
 */
export function montarExtrato(
  vendas: { id: string; data: string; valorCentavos: number; descricao: string | null; criadoEm: string }[],
  pagamentos: {
    id: string;
    data: string;
    valorCentavos: number;
    observacao: string | null;
    forma: string;
    criadoEm: string;
  }[]
): ItemExtrato[] {
  const itens: ItemExtrato[] = [
    ...vendas.map((v) => ({
      id: v.id,
      tipo: 'venda' as const,
      data: v.data,
      valorCentavos: v.valorCentavos,
      descricao: v.descricao,
      forma: null,
      criadoEm: v.criadoEm,
    })),
    ...pagamentos.map((p) => ({
      id: p.id,
      tipo: 'pagamento' as const,
      data: p.data,
      valorCentavos: p.valorCentavos,
      descricao: p.observacao,
      forma: p.forma,
      criadoEm: p.criadoEm,
    })),
  ];

  // Mais recente primeiro. Desempate por criadoEm: duas vendas no mesmo dia
  // aparecem na ordem em que foram lancadas, que e o que o comerciante espera.
  return itens.sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? 1 : -1;
    return a.criadoEm < b.criadoEm ? 1 : -1;
  });
}
