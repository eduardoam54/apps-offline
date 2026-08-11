/**
 * Repositorio do app veiculo.
 *
 * Abastecimento, manutencao e lembrete ficam aqui junto ao veiculo porque
 * sempre chegam juntos: buscar um veiculo normalmente significa tambem buscar
 * seu historico recente e seus lembretes.
 */
import { and, asc, desc, isNull, sql } from 'drizzle-orm';

import { novoId } from '../../id';
import { agora, hoje } from '../../date';
import {
  abastecimento,
  lembrete,
  manutencao,
  veiculo,
  type Abastecimento,
  type Lembrete,
  type Manutencao,
  type NovoAbastecimento,
  type NovoLembrete,
  type NovaManutencao,
  type NovoVeiculo,
  type Veiculo,
} from '../schema';
import type { BancoSQLite } from '../tipos';

// ---------------------------------------------------------------------------
// Veiculo
// ---------------------------------------------------------------------------

export async function criarVeiculo(
  db: BancoSQLite,
  dados: Omit<NovoVeiculo, 'id' | 'criadoEm' | 'atualizadoEm' | 'deletadoEm'>
): Promise<Veiculo> {
  const id = novoId();
  const agr = agora();
  await db.insert(veiculo).values({ ...dados, id, criadoEm: agr, atualizadoEm: agr });
  const [criado] = await db.select().from(veiculo).where(sql`${veiculo.id} = ${id}`);
  return criado!;
}

export async function buscarVeiculo(
  db: BancoSQLite,
  id: string
): Promise<Veiculo | null> {
  const [v] = await db.select().from(veiculo).where(
    and(sql`${veiculo.id} = ${id}`, isNull(veiculo.deletadoEm))
  );
  return v ?? null;
}

export async function listarVeiculos(db: BancoSQLite): Promise<Veiculo[]> {
  return db
    .select()
    .from(veiculo)
    .where(isNull(veiculo.deletadoEm))
    .orderBy(asc(veiculo.criadoEm));
}

export async function editarVeiculo(
  db: BancoSQLite,
  id: string,
  dados: Partial<Pick<Veiculo, 'apelido' | 'placa' | 'marcaModelo' | 'kmAtual'>>
): Promise<void> {
  await db
    .update(veiculo)
    .set({ ...dados, atualizadoEm: agora() })
    .where(sql`${veiculo.id} = ${id}`);
}

export async function arquivarVeiculo(db: BancoSQLite, id: string): Promise<void> {
  await db.update(veiculo).set({ deletadoEm: agora() }).where(sql`${veiculo.id} = ${id}`);
}

// ---------------------------------------------------------------------------
// Abastecimento
// ---------------------------------------------------------------------------

export async function registrarAbastecimento(
  db: BancoSQLite,
  veiculoId: string,
  dados: Omit<NovoAbastecimento, 'id' | 'veiculoId' | 'criadoEm' | 'deletadoEm'>
): Promise<Abastecimento> {
  const id = novoId();
  await db.insert(abastecimento).values({
    ...dados,
    id,
    veiculoId,
    criadoEm: agora(),
  });

  // Atualiza km atual do veiculo se este abastecimento e o mais recente.
  await db
    .update(veiculo)
    .set({ kmAtual: dados.km, atualizadoEm: agora() })
    .where(
      and(
        sql`${veiculo.id} = ${veiculoId}`,
        sql`${dados.km} >= ${veiculo.kmAtual}`
      )
    );

  const [criado] = await db
    .select()
    .from(abastecimento)
    .where(sql`${abastecimento.id} = ${id}`);
  return criado!;
}

export async function listarAbastecimentos(
  db: BancoSQLite,
  veiculoId: string
): Promise<Abastecimento[]> {
  return db
    .select()
    .from(abastecimento)
    .where(and(sql`${abastecimento.veiculoId} = ${veiculoId}`, isNull(abastecimento.deletadoEm)))
    .orderBy(desc(abastecimento.km));
}

export async function excluirAbastecimento(db: BancoSQLite, id: string): Promise<void> {
  await db.update(abastecimento).set({ deletadoEm: agora() }).where(sql`${abastecimento.id} = ${id}`);
}

// ---------------------------------------------------------------------------
// Manutencao
// ---------------------------------------------------------------------------

export async function registrarManutencao(
  db: BancoSQLite,
  veiculoId: string,
  dados: Omit<NovaManutencao, 'id' | 'veiculoId' | 'criadoEm' | 'deletadoEm'>
): Promise<Manutencao> {
  const id = novoId();
  await db.insert(manutencao).values({
    ...dados,
    id,
    veiculoId,
    criadoEm: agora(),
  });

  await db
    .update(veiculo)
    .set({ kmAtual: dados.km, atualizadoEm: agora() })
    .where(
      and(
        sql`${veiculo.id} = ${veiculoId}`,
        sql`${dados.km} >= ${veiculo.kmAtual}`
      )
    );

  const [criada] = await db.select().from(manutencao).where(sql`${manutencao.id} = ${id}`);
  return criada!;
}

export async function listarManutencoes(
  db: BancoSQLite,
  veiculoId: string
): Promise<Manutencao[]> {
  return db
    .select()
    .from(manutencao)
    .where(and(sql`${manutencao.veiculoId} = ${veiculoId}`, isNull(manutencao.deletadoEm)))
    .orderBy(desc(manutencao.km));
}

export async function excluirManutencao(db: BancoSQLite, id: string): Promise<void> {
  await db.update(manutencao).set({ deletadoEm: agora() }).where(sql`${manutencao.id} = ${id}`);
}

// ---------------------------------------------------------------------------
// Lembrete
// ---------------------------------------------------------------------------

export async function criarLembrete(
  db: BancoSQLite,
  veiculoId: string,
  dados: Omit<NovoLembrete, 'id' | 'veiculoId' | 'criadoEm' | 'deletadoEm' | 'concluido'>
): Promise<Lembrete> {
  const id = novoId();
  await db.insert(lembrete).values({
    ...dados,
    id,
    veiculoId,
    concluido: false,
    criadoEm: agora(),
  });
  const [criado] = await db.select().from(lembrete).where(sql`${lembrete.id} = ${id}`);
  return criado!;
}

export async function listarLembretes(
  db: BancoSQLite,
  veiculoId: string,
  { incluirConcluidos = false } = {}
): Promise<Lembrete[]> {
  const filtros = [
    sql`${lembrete.veiculoId} = ${veiculoId}`,
    isNull(lembrete.deletadoEm),
    ...(incluirConcluidos ? [] : [sql`${lembrete.concluido} = 0`]),
  ];
  return db
    .select()
    .from(lembrete)
    .where(and(...filtros))
    .orderBy(asc(lembrete.criadoEm));
}

export async function concluirLembrete(db: BancoSQLite, id: string): Promise<void> {
  await db.update(lembrete).set({ concluido: true }).where(sql`${lembrete.id} = ${id}`);
}

export async function excluirLembrete(db: BancoSQLite, id: string): Promise<void> {
  await db.update(lembrete).set({ deletadoEm: agora() }).where(sql`${lembrete.id} = ${id}`);
}

// ---------------------------------------------------------------------------
// Calculo de consumo medio
//
// Apenas entre dois abastecimentos de tanque cheio: unica forma de o numero
// ser confiavel. Abastecimentos parciais nao entram no calculo de km/l.
// ---------------------------------------------------------------------------

export type ConsumoMedio = {
  kmPorLitro: number; // km/l com 2 casas decimais
  distancia: number; // km percorridos no periodo
  litros: number; // litros consumidos (em milesimos)
};

export function calcularConsumo(historico: Abastecimento[]): ConsumoMedio | null {
  // Ordena do mais antigo para o mais recente (km crescente).
  const cheios = [...historico]
    .filter((a) => a.tanqueCheio && a.deletadoEm == null)
    .sort((a, b) => a.km - b.km);

  if (cheios.length < 2) return null;

  // Considera todos os cheios para media ponderada.
  const primeiro = cheios[0]!;
  const ultimo = cheios[cheios.length - 1]!;

  // Litros de todos os cheios exceto o primeiro (o primeiro abastece o ponto
  // de partida, o que o carro foi consumir foi registrado nos seguintes).
  const litrosTotais = cheios
    .slice(1)
    .reduce((soma, a) => soma + a.litrosMilesimos, 0);

  const distancia = ultimo.km - primeiro.km;

  if (distancia <= 0 || litrosTotais <= 0) return null;

  // km/l = distancia / (litros / 1000)
  const kmPorLitro = Math.round((distancia / (litrosTotais / 1000)) * 100) / 100;

  return { kmPorLitro, distancia, litros: litrosTotais };
}

// ---------------------------------------------------------------------------
// Consultas ao vivo (useConsultaViva)
// ---------------------------------------------------------------------------

export function consultaVeiculos(db: BancoSQLite) {
  return db.select().from(veiculo).where(isNull(veiculo.deletadoEm)).orderBy(asc(veiculo.criadoEm));
}

export function consultaAbastecimentos(db: BancoSQLite, veiculoId: string) {
  return db
    .select()
    .from(abastecimento)
    .where(and(sql`${abastecimento.veiculoId} = ${veiculoId}`, isNull(abastecimento.deletadoEm)))
    .orderBy(desc(abastecimento.km));
}

export function consultaManutencoes(db: BancoSQLite, veiculoId: string) {
  return db
    .select()
    .from(manutencao)
    .where(and(sql`${manutencao.veiculoId} = ${veiculoId}`, isNull(manutencao.deletadoEm)))
    .orderBy(desc(manutencao.km));
}

export function consultaLembretes(db: BancoSQLite, veiculoId: string) {
  return db
    .select()
    .from(lembrete)
    .where(
      and(
        sql`${lembrete.veiculoId} = ${veiculoId}`,
        sql`${lembrete.concluido} = 0`,
        isNull(lembrete.deletadoEm)
      )
    )
    .orderBy(asc(lembrete.criadoEm));
}

export const TABELAS_DO_VEICULO = ['veiculo', 'abastecimento', 'manutencao', 'lembrete'] as const;

// ---------------------------------------------------------------------------
// Alertas (lembretes vencidos ou proximos do vencimento)
// ---------------------------------------------------------------------------

export type StatusLembrete = 'vencido' | 'proximo' | 'ok';

/**
 * Retorna o status de um lembrete dado o km atual do veiculo e a data de hoje.
 *
 * `proximo` = dentro de 500 km ou 7 dias do alvo.
 */
export function statusDoLembrete(
  lem: Lembrete,
  kmAtual: number,
  dataHoje: string
): StatusLembrete {
  if (lem.tipo === 'km' && lem.kmAlvo != null) {
    const diff = lem.kmAlvo - kmAtual;
    if (diff <= 0) return 'vencido';
    if (diff <= 500) return 'proximo';
    return 'ok';
  }

  if (lem.tipo === 'data' && lem.dataAlvo != null) {
    if (lem.dataAlvo <= dataHoje) return 'vencido';
    // 7 dias
    const alvo = new Date(lem.dataAlvo);
    const hoje2 = new Date(dataHoje);
    const dias = (alvo.getTime() - hoje2.getTime()) / 86_400_000;
    if (dias <= 7) return 'proximo';
    return 'ok';
  }

  return 'ok';
}
