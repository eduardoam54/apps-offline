import { asc, eq, isNull, and } from 'drizzle-orm';

import { agora, hoje, type DataISO } from '../../date';
import { novoId } from '../../id';
import { somar, totalDoItem, type Centavos } from '../../money';
import { venda, vendaItem, type Venda, type VendaItem } from '../schema';
import type { BancoSQLite } from '../tipos';
import { registrarProdutos } from './produto';

export type ItemEntrada = {
  descricao: string;
  quantidadeMilesimos?: number;
  valorUnitarioCentavos: Centavos;
};

export type DadosVenda = {
  clienteId: string;
  valorCentavos?: Centavos;
  data?: DataISO;
  descricao?: string | null;
  itens?: ItemEntrada[];
};

/**
 * Lanca uma divida.
 *
 * Dois caminhos de entrada, um so resultado:
 *
 *   - valor direto      o caminho rapido do balcao, "Seu Joao levou 42 reais"
 *   - lista de itens    quando o comerciante quer detalhar o que foi levado
 *
 * Havendo itens, o total e SEMPRE recalculado a partir deles e o valor digitado
 * e ignorado. Isso garante que `venda.valor_centavos` nunca discorde da soma dos
 * itens — e por isso o calculo de saldo pode ler so a venda, sem JOIN.
 */
export async function lancarVenda(db: BancoSQLite, dados: DadosVenda): Promise<Venda> {
  const itens = dados.itens ?? [];

  const total =
    itens.length > 0
      ? somar(
          ...itens.map((i) => totalDoItem(i.valorUnitarioCentavos, i.quantidadeMilesimos ?? 1000))
        )
      : (dados.valorCentavos ?? 0);

  if (total <= 0) {
    throw new Error('lancarVenda: o valor precisa ser maior que zero');
  }

  const linha = {
    id: novoId(),
    clienteId: dados.clienteId,
    data: dados.data ?? hoje(),
    valorCentavos: total,
    descricao: dados.descricao?.trim() || null,
    cobradoEm: null,
    criadoEm: agora(),
    deletadoEm: null,
  };

  await db.insert(venda).values(linha);

  if (itens.length > 0) {
    await db.insert(vendaItem).values(
      itens.map((item, indice) => ({
        id: novoId(),
        vendaId: linha.id,
        descricao: item.descricao.trim(),
        quantidadeMilesimos: item.quantidadeMilesimos ?? 1000,
        valorUnitarioCentavos: item.valorUnitarioCentavos,
        ordem: indice,
      }))
    );

    // O catalogo de sugestoes se alimenta daqui. Fica dentro de lancarVenda, e
    // nao a cargo da tela, para nenhum caminho de lancamento esquecer de fazer.
    await registrarProdutos(db, itens);
  }

  return linha;
}

export async function buscarVenda(db: BancoSQLite, id: string): Promise<Venda | null> {
  const linhas = await db.select().from(venda).where(eq(venda.id, id)).limit(1);
  return (linhas[0] as Venda | undefined) ?? null;
}

export async function itensDaVenda(db: BancoSQLite, vendaId: string): Promise<VendaItem[]> {
  return (await db
    .select()
    .from(vendaItem)
    .where(eq(vendaItem.vendaId, vendaId))
    .orderBy(asc(vendaItem.ordem))) as VendaItem[];
}

export async function editarVenda(
  db: BancoSQLite,
  id: string,
  dados: { valorCentavos?: Centavos; data?: DataISO; descricao?: string | null }
): Promise<void> {
  const mudancas: Record<string, unknown> = {};

  if (dados.valorCentavos !== undefined) {
    if (dados.valorCentavos <= 0) {
      throw new Error('editarVenda: o valor precisa ser maior que zero');
    }
    mudancas.valorCentavos = dados.valorCentavos;
  }
  if (dados.data !== undefined) mudancas.data = dados.data;
  if (dados.descricao !== undefined) mudancas.descricao = dados.descricao?.trim() || null;

  if (Object.keys(mudancas).length === 0) return;
  await db.update(venda).set(mudancas).where(eq(venda.id, id));
}

/** Exclusao logica: some da lista e do saldo, mas o registro continua no banco. */
export async function excluirVenda(db: BancoSQLite, id: string): Promise<void> {
  await db.update(venda).set({ deletadoEm: agora() }).where(eq(venda.id, id));
}

/** Desfazer da exclusao — o snackbar de "desfazer" depende disto. */
export async function restaurarVenda(db: BancoSQLite, id: string): Promise<void> {
  await db.update(venda).set({ deletadoEm: null }).where(eq(venda.id, id));
}

/** Marca as vendas em aberto do cliente como ja cobradas hoje. */
export async function marcarComoCobrado(db: BancoSQLite, clienteId: string): Promise<void> {
  await db
    .update(venda)
    .set({ cobradoEm: agora() })
    .where(and(eq(venda.clienteId, clienteId), isNull(venda.deletadoEm)));
}
