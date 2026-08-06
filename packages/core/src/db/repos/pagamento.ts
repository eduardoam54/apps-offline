import { eq } from 'drizzle-orm';

import { agora, hoje, type DataISO } from '../../date';
import { novoId } from '../../id';
import type { Centavos } from '../../money';
import { pagamento, type FormaPagamento, type Pagamento } from '../schema';
import type { BancoSQLite } from '../tipos';

export type DadosPagamento = {
  clienteId: string;
  valorCentavos: Centavos;
  data?: DataISO;
  forma?: FormaPagamento;
  observacao?: string | null;
  acordoParcelaId?: string | null;
};

/**
 * Registra um pagamento.
 *
 * Nao ha validacao contra o saldo de proposito: pagar mais do que se deve e uma
 * situacao real (cliente deixa troco adiantado) e vira saldo negativo, que o app
 * mostra como credito. Bloquear isso obrigaria o comerciante a mentir para o app.
 */
export async function receberPagamento(
  db: BancoSQLite,
  dados: DadosPagamento
): Promise<Pagamento> {
  if (dados.valorCentavos <= 0) {
    throw new Error('receberPagamento: o valor precisa ser maior que zero');
  }

  const linha = {
    id: novoId(),
    clienteId: dados.clienteId,
    data: dados.data ?? hoje(),
    valorCentavos: dados.valorCentavos,
    forma: dados.forma ?? ('dinheiro' as FormaPagamento),
    acordoParcelaId: dados.acordoParcelaId ?? null,
    observacao: dados.observacao?.trim() || null,
    criadoEm: agora(),
    deletadoEm: null,
  };

  await db.insert(pagamento).values(linha);
  return linha;
}

export async function buscarPagamento(db: BancoSQLite, id: string): Promise<Pagamento | null> {
  const linhas = await db.select().from(pagamento).where(eq(pagamento.id, id)).limit(1);
  return (linhas[0] as Pagamento | undefined) ?? null;
}

export async function editarPagamento(
  db: BancoSQLite,
  id: string,
  dados: { valorCentavos?: Centavos; data?: DataISO; forma?: FormaPagamento; observacao?: string | null }
): Promise<void> {
  const mudancas: Record<string, unknown> = {};

  if (dados.valorCentavos !== undefined) {
    if (dados.valorCentavos <= 0) {
      throw new Error('editarPagamento: o valor precisa ser maior que zero');
    }
    mudancas.valorCentavos = dados.valorCentavos;
  }
  if (dados.data !== undefined) mudancas.data = dados.data;
  if (dados.forma !== undefined) mudancas.forma = dados.forma;
  if (dados.observacao !== undefined) mudancas.observacao = dados.observacao?.trim() || null;

  if (Object.keys(mudancas).length === 0) return;
  await db.update(pagamento).set(mudancas).where(eq(pagamento.id, id));
}

export async function excluirPagamento(db: BancoSQLite, id: string): Promise<void> {
  await db.update(pagamento).set({ deletadoEm: agora() }).where(eq(pagamento.id, id));
}

export async function restaurarPagamento(db: BancoSQLite, id: string): Promise<void> {
  await db.update(pagamento).set({ deletadoEm: null }).where(eq(pagamento.id, id));
}
