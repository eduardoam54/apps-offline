import { and, asc, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';

import type { DataISO } from '../date';
import type { Centavos } from '../money';
import { cliente, orcamento, orcamentoItem, pagamento, venda, vendaItem } from './schema';
import type { BancoSQLite } from './tipos';

/**
 * Consultas de leitura.
 *
 * Devolvem o CONSTRUTOR da query, nao o resultado, para poderem ser passadas ao
 * `useConsultaViva` (ver viva.ts) — e ele que faz a tela se atualizar sozinha
 * quando uma venda e lancada em outro lugar do app.
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

/** Quando este cliente entrou numa cobranca pela ultima vez. */
const expressaoUltimaCobranca = sql<string | null>`(
  select max(v.cobrado_em) from venda v
  where v.cliente_id = cliente.id and v.deletado_em is null
)`;

/**
 * Tabelas lidas por toda consulta que envolve saldo.
 *
 * Existe porque `venda` e `pagamento` aparecem apenas dentro do `sql` cru das
 * subconsultas acima — nenhuma ferramenta consegue descobrir sozinha que a
 * consulta depende delas. Passe esta constante ao `useConsultaViva`, senao a
 * tela mostra saldo velho depois de um lancamento.
 */
export const TABELAS_DO_SALDO = ['cliente', 'venda', 'pagamento'] as const;

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
  ultimaCobranca: string | null;
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
      ultimaCobranca: expressaoUltimaCobranca,
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

/**
 * Quanto entrou de dinheiro num periodo. Alimenta o "recebido no mes".
 *
 * Conta pagamento de qualquer cliente, inclusive arquivado: o dinheiro entrou de
 * verdade no caixa, e some-lo do historico so porque o cliente saiu da lista
 * daria um numero que nao bate com a realidade.
 */
export function consultaRecebidoNoPeriodo(db: BancoSQLite, inicio: string, fim: string) {
  return db
    .select({ total: sql<number>`coalesce(sum(${pagamento.valorCentavos}), 0)` })
    .from(pagamento)
    .where(
      and(
        isNull(pagamento.deletadoEm),
        gte(pagamento.data, inicio),
        lte(pagamento.data, fim)
      )
    );
}

/**
 * Quantos itens a venda tem.
 *
 * Mesma regra da correlacao de saldo: `venda.id` vai como texto SQL literal.
 * Interpolar a coluna faria o Drizzle emitir so `"id"`, que dentro da subconsulta
 * casaria com `venda_item.id` e a contagem sairia errada.
 */
const expressaoQtdItens = sql<number>`(
  select count(*) from venda_item i where i.venda_id = venda.id
)`;

export function consultaVendasDoCliente(db: BancoSQLite, clienteId: string) {
  return db
    .select({
      id: venda.id,
      clienteId: venda.clienteId,
      data: venda.data,
      valorCentavos: venda.valorCentavos,
      descricao: venda.descricao,
      cobradoEm: venda.cobradoEm,
      criadoEm: venda.criadoEm,
      qtdItens: expressaoQtdItens,
    })
    .from(venda)
    .where(and(eq(venda.clienteId, clienteId), isNull(venda.deletadoEm)))
    .orderBy(desc(venda.data), desc(venda.criadoEm));
}

/** Itens de uma venda, na ordem em que foram digitados. */
export function consultaItensDaVenda(db: BancoSQLite, vendaId: string) {
  return db
    .select()
    .from(vendaItem)
    .where(eq(vendaItem.vendaId, vendaId))
    .orderBy(asc(vendaItem.ordem));
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

/** Uma linha da planilha exportada: venda ou pagamento, com o nome do cliente. */
export type LinhaExportacao = {
  cliente: string;
  data: string;
  tipo: 'venda' | 'pagamento';
  descricao: string | null;
  /** So em pagamento. */
  forma: string | null;
  valorCentavos: Centavos;
};

/**
 * Todos os lancamentos da caderneta, para a planilha.
 *
 * DUAS CONSULTAS SEPARADAS, e nao uma com dois JOIN. A armadilha do produto
 * cartesiano vale aqui igual ao saldo: juntar venda e pagamento na mesma
 * consulta multiplicaria as linhas e a planilha mostraria dividas que nunca
 * existiram. Cada consulta abaixo tem UM join, com a tabela pai, o que e seguro.
 *
 * Lancamento de cliente arquivado entra. Arquivar significa "esse nao esta mais
 * na minha lista", nao "essa venda nunca aconteceu" — e uma planilha de
 * historico que esconde movimento passado nao serve para conferir nada.
 */
export async function listarLancamentosParaExportar(
  db: BancoSQLite
): Promise<LinhaExportacao[]> {
  const vendas = await db
    .select({
      cliente: cliente.nome,
      data: venda.data,
      descricao: venda.descricao,
      valorCentavos: venda.valorCentavos,
    })
    .from(venda)
    .innerJoin(cliente, eq(venda.clienteId, cliente.id))
    .where(isNull(venda.deletadoEm));

  const pagamentos = await db
    .select({
      cliente: cliente.nome,
      data: pagamento.data,
      descricao: pagamento.observacao,
      forma: pagamento.forma,
      valorCentavos: pagamento.valorCentavos,
    })
    .from(pagamento)
    .innerJoin(cliente, eq(pagamento.clienteId, cliente.id))
    .where(isNull(pagamento.deletadoEm));

  return [
    ...(vendas as Omit<LinhaExportacao, 'tipo' | 'forma'>[]).map((v) => ({
      ...v,
      tipo: 'venda' as const,
      forma: null,
    })),
    ...(pagamentos as Omit<LinhaExportacao, 'tipo'>[]).map((p) => ({
      ...p,
      tipo: 'pagamento' as const,
    })),
  ];
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
  /** Só faz sentido em venda; zero quando o lançamento foi só de valor. */
  qtdItens: number;
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
  vendas: {
    id: string;
    data: string;
    valorCentavos: number;
    descricao: string | null;
    criadoEm: string;
    qtdItens?: number;
  }[],
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
      qtdItens: v.qtdItens ?? 0,
    })),
    ...pagamentos.map((p) => ({
      id: p.id,
      tipo: 'pagamento' as const,
      data: p.data,
      valorCentavos: p.valorCentavos,
      descricao: p.observacao,
      forma: p.forma,
      criadoEm: p.criadoEm,
      qtdItens: 0,
    })),
  ];

  // Mais recente primeiro. Desempate por criadoEm: duas vendas no mesmo dia
  // aparecem na ordem em que foram lancadas, que e o que o comerciante espera.
  return itens.sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? 1 : -1;
    return a.criadoEm < b.criadoEm ? 1 : -1;
  });
}

// -------------------------------------------------------------- orcamento

/**
 * Tabelas que uma consulta de orcamento le, para `useConsultaViva`.
 * Lancar um orcamento novo precisa invalidar a lista mesmo sem venda/pagamento
 * envolvidos.
 */
export const TABELAS_DO_ORCAMENTO = ['orcamento', 'orcamento_item', 'cliente'] as const;

/** Lista de orcamentos com o nome do cliente, mais recentes primeiro. */
export function consultaOrcamentos(db: BancoSQLite) {
  return db
    .select({
      id: orcamento.id,
      numero: orcamento.numero,
      data: orcamento.data,
      status: orcamento.status,
      totalCentavos: orcamento.totalCentavos,
      clienteId: orcamento.clienteId,
      clienteNome: cliente.nome,
      criadoEm: orcamento.criadoEm,
    })
    .from(orcamento)
    .innerJoin(cliente, eq(orcamento.clienteId, cliente.id))
    .where(isNull(orcamento.deletadoEm))
    .orderBy(desc(orcamento.criadoEm));
}

/** Orcamentos de um cliente, para o historico na tela de detalhe dele. */
export function consultaOrcamentosDoCliente(db: BancoSQLite, clienteId: string) {
  return db
    .select()
    .from(orcamento)
    .where(and(eq(orcamento.clienteId, clienteId), isNull(orcamento.deletadoEm)))
    .orderBy(desc(orcamento.criadoEm));
}

/** Itens de um orcamento, na ordem em que foram digitados. */
export function consultaItensDoOrcamento(db: BancoSQLite, orcamentoId: string) {
  return db
    .select()
    .from(orcamentoItem)
    .where(eq(orcamentoItem.orcamentoId, orcamentoId))
    .orderBy(asc(orcamentoItem.ordem));
}

/**
 * Quantos orcamentos (nao excluidos) foram criados num intervalo de datas.
 * Alimenta o gate do plano gratuito (3 por mes) — ver `packages/core/src/plano.ts`.
 */
export function consultaOrcamentosDoPeriodo(db: BancoSQLite, inicio: DataISO, fim: DataISO) {
  return db
    .select({ id: orcamento.id })
    .from(orcamento)
    .where(
      and(isNull(orcamento.deletadoEm), gte(orcamento.data, inicio), lte(orcamento.data, fim))
    );
}

/** Versao ja resolvida, para o gate de plano checar antes de criar um orcamento. */
export async function contarOrcamentosDoPeriodo(
  db: BancoSQLite,
  inicio: DataISO,
  fim: DataISO
): Promise<number> {
  const linhas = await consultaOrcamentosDoPeriodo(db, inicio, fim);
  return linhas.length;
}
