import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import { adicionarDias, adicionarMeses, agora, hoje, type DataISO } from '../../date';
import { novoId } from '../../id';
import { dividirParcelas, type Centavos } from '../../money';
import { acordo, acordoParcela, type Acordo, type AcordoParcela } from '../schema';
import type { BancoSQLite } from '../tipos';
import { receberPagamento } from './pagamento';

/**
 * Acordo de parcelamento.
 *
 * A REGRA CENTRAL, e a que mais facilmente se erra: **acordo nao cria divida**.
 *
 * Ele e uma releitura de divida que ja existe em `venda`. O cliente deve R$ 300
 * e combina pagar em 3x de R$ 100 — os R$ 300 continuam sendo os mesmos R$ 300.
 * Se o acordo lancasse valor proprio, o saldo passaria a R$ 600 e o comerciante
 * cobraria o dobro.
 *
 * Por isso nada aqui escreve em `venda`. O que mexe no saldo continua sendo
 * exclusivamente venda e pagamento; quitar uma parcela gera uma linha em
 * `pagamento` apontando de volta para a parcela, e e so isso.
 */

export type Periodicidade = 'mensal' | 'quinzenal' | 'semanal';

export type DadosAcordo = {
  clienteId: string;
  valorTotalCentavos: Centavos;
  numParcelas: number;
  primeiroVencimento: DataISO;
  periodicidade?: Periodicidade;
  observacao?: string | null;
};

/**
 * Calcula os vencimentos SEMPRE a partir do primeiro, nunca do anterior.
 *
 * Encadear (`proximo = anterior + 1 mes`) faz um acordo comecado em 31/01 virar
 * 28/02, depois 28/03, depois 28/04 — o dia se perde na primeira vez que cai num
 * mes curto e nunca mais volta. Contando do original, o dia 31 se recupera nos
 * meses que o comportam.
 */
export function calcularVencimento(
  primeiro: DataISO,
  indice: number,
  periodicidade: Periodicidade
): DataISO {
  if (periodicidade === 'mensal') return adicionarMeses(primeiro, indice);
  if (periodicidade === 'quinzenal') return adicionarDias(primeiro, indice * 15);
  return adicionarDias(primeiro, indice * 7);
}

export async function criarAcordo(
  db: BancoSQLite,
  dados: DadosAcordo
): Promise<{ acordo: Acordo; parcelas: AcordoParcela[] }> {
  if (dados.valorTotalCentavos <= 0) {
    throw new Error('criarAcordo: o valor precisa ser maior que zero');
  }
  if (!Number.isInteger(dados.numParcelas) || dados.numParcelas < 1) {
    throw new Error('criarAcordo: numero de parcelas invalido');
  }

  const periodicidade = dados.periodicidade ?? 'mensal';
  const valores = dividirParcelas(dados.valorTotalCentavos, dados.numParcelas);

  const linhaAcordo = {
    id: novoId(),
    clienteId: dados.clienteId,
    valorTotalCentavos: dados.valorTotalCentavos,
    numParcelas: dados.numParcelas,
    status: 'ativo' as const,
    observacao: dados.observacao?.trim() || null,
    criadoEm: agora(),
    deletadoEm: null,
  };

  const linhasParcelas = valores.map((valor, indice) => ({
    id: novoId(),
    acordoId: linhaAcordo.id,
    numero: indice + 1,
    valorCentavos: valor,
    vencimento: calcularVencimento(dados.primeiroVencimento, indice, periodicidade),
    pagoEm: null,
  }));

  await db.insert(acordo).values(linhaAcordo);
  await db.insert(acordoParcela).values(linhasParcelas);

  return { acordo: linhaAcordo, parcelas: linhasParcelas };
}

/**
 * Quita uma parcela.
 *
 * Gera o pagamento — que e o que efetivamente abate o saldo — e so entao marca a
 * parcela. Se o acordo ficar todo quitado, ele passa a `cumprido`.
 */
export async function quitarParcela(
  db: BancoSQLite,
  parcelaId: string,
  opcoes: { data?: DataISO; forma?: 'dinheiro' | 'pix' | 'cartao' | 'outro' } = {}
): Promise<void> {
  const parcelas = (await db
    .select()
    .from(acordoParcela)
    .where(eq(acordoParcela.id, parcelaId))
    .limit(1)) as AcordoParcela[];

  const parcela = parcelas[0];
  if (parcela == null) throw new Error('quitarParcela: parcela nao encontrada');
  if (parcela.pagoEm != null) throw new Error('quitarParcela: esta parcela ja foi paga');

  const acordos = (await db
    .select()
    .from(acordo)
    .where(eq(acordo.id, parcela.acordoId))
    .limit(1)) as Acordo[];

  const oAcordo = acordos[0];
  if (oAcordo == null) throw new Error('quitarParcela: acordo nao encontrado');

  const data = opcoes.data ?? hoje();

  await receberPagamento(db, {
    clienteId: oAcordo.clienteId,
    valorCentavos: parcela.valorCentavos,
    data,
    forma: opcoes.forma ?? 'dinheiro',
    acordoParcelaId: parcela.id,
    observacao: `Parcela ${parcela.numero} de ${oAcordo.numParcelas}`,
  });

  await db.update(acordoParcela).set({ pagoEm: data }).where(eq(acordoParcela.id, parcelaId));

  await atualizarStatusDoAcordo(db, oAcordo.id);
}

/** Fecha o acordo quando nao sobra parcela em aberto. */
async function atualizarStatusDoAcordo(db: BancoSQLite, acordoId: string): Promise<void> {
  const emAberto = (await db
    .select({ id: acordoParcela.id })
    .from(acordoParcela)
    .where(and(eq(acordoParcela.acordoId, acordoId), isNull(acordoParcela.pagoEm)))) as {
    id: string;
  }[];

  if (emAberto.length === 0) {
    await db.update(acordo).set({ status: 'cumprido' }).where(eq(acordo.id, acordoId));
  }
}

/**
 * Marca o acordo como quebrado.
 *
 * Nao desfaz pagamento nenhum: o que o cliente ja pagou continua abatido do
 * saldo. Quebrar so significa que o combinado deixou de valer.
 */
export async function quebrarAcordo(db: BancoSQLite, acordoId: string): Promise<void> {
  await db.update(acordo).set({ status: 'quebrado' }).where(eq(acordo.id, acordoId));
}

export function consultaAcordosDoCliente(db: BancoSQLite, clienteId: string) {
  return db
    .select()
    .from(acordo)
    .where(and(eq(acordo.clienteId, clienteId), isNull(acordo.deletadoEm)))
    .orderBy(desc(acordo.criadoEm));
}

export function consultaParcelasDoAcordo(db: BancoSQLite, acordoId: string) {
  return db
    .select()
    .from(acordoParcela)
    .where(eq(acordoParcela.acordoId, acordoId))
    .orderBy(asc(acordoParcela.numero));
}

export async function buscarAcordoAtivo(
  db: BancoSQLite,
  clienteId: string
): Promise<Acordo | null> {
  const linhas = (await db
    .select()
    .from(acordo)
    .where(
      and(eq(acordo.clienteId, clienteId), eq(acordo.status, 'ativo'), isNull(acordo.deletadoEm))
    )
    .orderBy(desc(acordo.criadoEm))
    .limit(1)) as Acordo[];

  return linhas[0] ?? null;
}

/** Proxima parcela em aberto de um acordo, a que deve ser cobrada primeiro. */
export async function proximaParcela(
  db: BancoSQLite,
  acordoId: string
): Promise<AcordoParcela | null> {
  const linhas = (await db
    .select()
    .from(acordoParcela)
    .where(and(eq(acordoParcela.acordoId, acordoId), isNull(acordoParcela.pagoEm)))
    .orderBy(asc(acordoParcela.numero))
    .limit(1)) as AcordoParcela[];

  return linhas[0] ?? null;
}

export type ParcelaVencida = {
  parcelaId: string;
  acordoId: string;
  clienteId: string;
  clienteNome: string;
  numero: number;
  valorCentavos: number;
  vencimento: string;
};

/**
 * Parcelas vencidas e ainda em aberto, de acordos ativos.
 *
 * Alimenta o alerta da tela inicial. Compara com o dia civil local — data de
 * vencimento e dia civil, entao a comparacao e de texto e nao sofre com fuso.
 */
export function consultaParcelasVencidas(db: BancoSQLite, referencia: DataISO = hoje()) {
  return db
    .select({
      parcelaId: acordoParcela.id,
      acordoId: acordo.id,
      clienteId: acordo.clienteId,
      clienteNome: sql<string>`(select nome from cliente where cliente.id = acordo.cliente_id)`,
      numero: acordoParcela.numero,
      valorCentavos: acordoParcela.valorCentavos,
      vencimento: acordoParcela.vencimento,
    })
    .from(acordoParcela)
    .innerJoin(acordo, eq(acordoParcela.acordoId, acordo.id))
    .where(
      and(
        isNull(acordoParcela.pagoEm),
        sql`${acordoParcela.vencimento} < ${referencia}`,
        eq(acordo.status, 'ativo'),
        isNull(acordo.deletadoEm)
      )
    )
    .orderBy(asc(acordoParcela.vencimento));
}
