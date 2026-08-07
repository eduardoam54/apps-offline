import { asc, count, eq } from 'drizzle-orm';

import { agora, hoje, type DataISO } from '../../date';
import { novoId } from '../../id';
import { somar, totalDoItem, type Centavos } from '../../money';
import {
  orcamento,
  orcamentoItem,
  type NovoOrcamentoItem,
  type Orcamento,
  type OrcamentoItem,
  type StatusOrcamento,
} from '../schema';
import type { BancoSQLite } from '../tipos';
import { registrarProdutos } from './produto';

export type ItemDeOrcamento = {
  descricao: string;
  quantidadeMilesimos?: number;
  valorUnitarioCentavos: Centavos;
};

export type DadosOrcamento = {
  clienteId: string;
  data?: DataISO;
  descontoCentavos?: Centavos;
  observacoes?: string | null;
  itens: ItemDeOrcamento[];
};

function calcularTotal(itens: ItemDeOrcamento[], descontoCentavos: Centavos): Centavos {
  const bruto = somar(
    ...itens.map((i) => totalDoItem(i.valorUnitarioCentavos, i.quantidadeMilesimos ?? 1000))
  );
  const total = bruto - descontoCentavos;
  return total > 0 ? total : 0;
}

async function proximoNumero(db: BancoSQLite): Promise<number> {
  const linhas = (await db.select({ total: count() }).from(orcamento)) as { total: number }[];
  return (linhas[0]?.total ?? 0) + 1;
}

async function inserirItens(
  db: BancoSQLite,
  orcamentoId: string,
  itens: ItemDeOrcamento[]
): Promise<void> {
  const linhas: NovoOrcamentoItem[] = itens.map((item, indice) => ({
    id: novoId(),
    orcamentoId,
    descricao: item.descricao.trim(),
    quantidadeMilesimos: item.quantidadeMilesimos ?? 1000,
    valorUnitarioCentavos: item.valorUnitarioCentavos,
    ordem: indice,
  }));

  await db.insert(orcamentoItem).values(linhas);
  await registrarProdutos(db, itens);
}

/** Cria o orcamento com seus itens. O total e SEMPRE recalculado a partir deles. */
export async function criarOrcamento(
  db: BancoSQLite,
  dados: DadosOrcamento
): Promise<{ orcamento: Orcamento; itens: OrcamentoItem[] }> {
  if (dados.itens.length === 0) {
    throw new Error('criarOrcamento: precisa de pelo menos um item');
  }

  const descontoCentavos = dados.descontoCentavos ?? 0;
  const total = calcularTotal(dados.itens, descontoCentavos);
  if (total <= 0) {
    throw new Error('criarOrcamento: o total precisa ser maior que zero');
  }

  const agoraISO = agora();
  const linha: Orcamento = {
    id: novoId(),
    clienteId: dados.clienteId,
    numero: await proximoNumero(db),
    data: dados.data ?? hoje(),
    status: 'aberto',
    totalCentavos: total,
    descontoCentavos,
    observacoes: dados.observacoes?.trim() || null,
    criadoEm: agoraISO,
    atualizadoEm: agoraISO,
    deletadoEm: null,
  };

  await db.insert(orcamento).values(linha);
  await inserirItens(db, linha.id, dados.itens);

  const itens = await itensDoOrcamento(db, linha.id);
  return { orcamento: linha, itens };
}

export async function buscarOrcamento(db: BancoSQLite, id: string): Promise<Orcamento | null> {
  const linhas = (await db
    .select()
    .from(orcamento)
    .where(eq(orcamento.id, id))
    .limit(1)) as Orcamento[];
  return linhas[0] ?? null;
}

export async function itensDoOrcamento(
  db: BancoSQLite,
  orcamentoId: string
): Promise<OrcamentoItem[]> {
  return (await db
    .select()
    .from(orcamentoItem)
    .where(eq(orcamentoItem.orcamentoId, orcamentoId))
    .orderBy(asc(orcamentoItem.ordem))) as OrcamentoItem[];
}

/**
 * Atualiza itens/desconto/observacoes e recalcula o total.
 *
 * So funciona com o orcamento `aberto`. Uma vez aprovado ou recusado, o total
 * fica congelado: e assim que o orcamento enviado ao cliente nao muda de valor
 * so porque um item foi editado depois.
 */
export async function atualizarOrcamento(
  db: BancoSQLite,
  id: string,
  dados: Partial<DadosOrcamento>
): Promise<void> {
  const atual = await buscarOrcamento(db, id);
  if (atual == null) throw new Error('atualizarOrcamento: orcamento nao encontrado');
  if (atual.status !== 'aberto') {
    throw new Error('atualizarOrcamento: so e possivel editar um orcamento em aberto');
  }

  const mudancas: Partial<Orcamento> = { atualizadoEm: agora() };
  if (dados.data !== undefined) mudancas.data = dados.data;
  if (dados.observacoes !== undefined) mudancas.observacoes = dados.observacoes?.trim() || null;

  if (dados.itens !== undefined) {
    if (dados.itens.length === 0) {
      throw new Error('atualizarOrcamento: precisa de pelo menos um item');
    }
    const descontoCentavos = dados.descontoCentavos ?? atual.descontoCentavos;
    mudancas.descontoCentavos = descontoCentavos;
    mudancas.totalCentavos = calcularTotal(dados.itens, descontoCentavos);

    await db.delete(orcamentoItem).where(eq(orcamentoItem.orcamentoId, id));
    await inserirItens(db, id, dados.itens);
  } else if (dados.descontoCentavos !== undefined) {
    const itens = await itensDoOrcamento(db, id);
    mudancas.descontoCentavos = dados.descontoCentavos;
    mudancas.totalCentavos = calcularTotal(itens, dados.descontoCentavos);
  }

  await db.update(orcamento).set(mudancas).where(eq(orcamento.id, id));
}

async function mudarStatus(
  db: BancoSQLite,
  id: string,
  status: StatusOrcamento
): Promise<void> {
  await db.update(orcamento).set({ status, atualizadoEm: agora() }).where(eq(orcamento.id, id));
}

export async function aprovarOrcamento(db: BancoSQLite, id: string): Promise<void> {
  await mudarStatus(db, id, 'aprovado');
}

export async function recusarOrcamento(db: BancoSQLite, id: string): Promise<void> {
  await mudarStatus(db, id, 'recusado');
}

/** Volta o orcamento para `aberto` — desfaz um clique errado em aprovar/recusar. */
export async function reabrirOrcamento(db: BancoSQLite, id: string): Promise<void> {
  await mudarStatus(db, id, 'aberto');
}

/**
 * Copia cliente e itens para um novo orcamento `aberto`.
 *
 * Servico repetido e a regra, nao a excecao — duplicar poupa redigitar tudo de
 * novo pro mesmo cliente.
 */
export async function duplicarOrcamento(
  db: BancoSQLite,
  id: string
): Promise<{ orcamento: Orcamento; itens: OrcamentoItem[] }> {
  const original = await buscarOrcamento(db, id);
  if (original == null) throw new Error('duplicarOrcamento: orcamento nao encontrado');

  const itensOriginais = await itensDoOrcamento(db, id);

  return criarOrcamento(db, {
    clienteId: original.clienteId,
    descontoCentavos: original.descontoCentavos,
    observacoes: original.observacoes,
    itens: itensOriginais.map((item) => ({
      descricao: item.descricao,
      quantidadeMilesimos: item.quantidadeMilesimos,
      valorUnitarioCentavos: item.valorUnitarioCentavos,
    })),
  });
}

/** Exclusao logica: some da lista, mas o registro continua no banco. */
export async function excluirOrcamento(db: BancoSQLite, id: string): Promise<void> {
  await db.update(orcamento).set({ deletadoEm: agora() }).where(eq(orcamento.id, id));
}

export async function restaurarOrcamento(db: BancoSQLite, id: string): Promise<void> {
  await db.update(orcamento).set({ deletadoEm: null }).where(eq(orcamento.id, id));
}
