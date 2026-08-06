import { and, eq, isNull } from 'drizzle-orm';

import { agora } from '../../date';
import { novoId } from '../../id';
import { cliente, type Cliente } from '../schema';
import type { BancoSQLite } from '../tipos';

export type DadosCliente = {
  nome: string;
  apelido?: string | null;
  telefone?: string | null;
  fotoUri?: string | null;
  limiteCreditoCentavos?: number | null;
  observacao?: string | null;
};

/** Remove tudo que nao e digito. Telefone e guardado cru para virar link wa.me. */
export function normalizarTelefone(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, '');
  return digitos === '' ? null : digitos;
}

export async function criarCliente(db: BancoSQLite, dados: DadosCliente): Promise<Cliente> {
  const nome = dados.nome.trim();
  if (nome === '') {
    throw new Error('criarCliente: nome e obrigatorio');
  }

  const instante = agora();
  const linha = {
    id: novoId(),
    nome,
    apelido: dados.apelido?.trim() || null,
    telefone: normalizarTelefone(dados.telefone),
    fotoUri: dados.fotoUri ?? null,
    limiteCreditoCentavos: dados.limiteCreditoCentavos ?? null,
    observacao: dados.observacao?.trim() || null,
    criadoEm: instante,
    atualizadoEm: instante,
    deletadoEm: null,
  };

  await db.insert(cliente).values(linha);
  return linha;
}

export async function atualizarCliente(
  db: BancoSQLite,
  id: string,
  dados: Partial<DadosCliente>
): Promise<void> {
  const mudancas: Record<string, unknown> = { atualizadoEm: agora() };

  if (dados.nome !== undefined) {
    const nome = dados.nome.trim();
    if (nome === '') throw new Error('atualizarCliente: nome nao pode ficar vazio');
    mudancas.nome = nome;
  }
  if (dados.apelido !== undefined) mudancas.apelido = dados.apelido?.trim() || null;
  if (dados.telefone !== undefined) mudancas.telefone = normalizarTelefone(dados.telefone);
  if (dados.fotoUri !== undefined) mudancas.fotoUri = dados.fotoUri;
  if (dados.limiteCreditoCentavos !== undefined) {
    mudancas.limiteCreditoCentavos = dados.limiteCreditoCentavos;
  }
  if (dados.observacao !== undefined) mudancas.observacao = dados.observacao?.trim() || null;

  await db.update(cliente).set(mudancas).where(eq(cliente.id, id));
}

export async function buscarCliente(db: BancoSQLite, id: string): Promise<Cliente | null> {
  const linhas = await db.select().from(cliente).where(eq(cliente.id, id)).limit(1);
  return (linhas[0] as Cliente | undefined) ?? null;
}

/**
 * Arquiva o cliente. Nunca apaga.
 *
 * O historico de vendas e pagamentos continua intacto — se o comerciante
 * arquivar por engano, reativar devolve tudo. Perder o registro de uma divida
 * seria o pior defeito possivel neste app.
 */
export async function arquivarCliente(db: BancoSQLite, id: string): Promise<void> {
  await db
    .update(cliente)
    .set({ deletadoEm: agora(), atualizadoEm: agora() })
    .where(eq(cliente.id, id));
}

export async function reativarCliente(db: BancoSQLite, id: string): Promise<void> {
  await db
    .update(cliente)
    .set({ deletadoEm: null, atualizadoEm: agora() })
    .where(eq(cliente.id, id));
}

/** Usado pelo limite do plano gratuito (fase 7). */
export async function contarClientesAtivos(db: BancoSQLite): Promise<number> {
  const linhas = await db.select({ id: cliente.id }).from(cliente).where(isNull(cliente.deletadoEm));
  return linhas.length;
}

/** Evita cadastrar "Seu Joao" duas vezes por engano. */
export async function existeClienteComNome(
  db: BancoSQLite,
  nome: string,
  ignorarId?: string
): Promise<boolean> {
  const linhas = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(and(eq(cliente.nome, nome.trim()), isNull(cliente.deletadoEm)));

  return linhas.some((l) => (l as { id: string }).id !== ignorarId);
}
