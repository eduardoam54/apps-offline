import { eq } from 'drizzle-orm';

import { agora } from '../../date';
import { config } from '../schema';
import type { BancoSQLite } from '../tipos';

/**
 * Configuracao do app, em tabela chave/valor.
 *
 * Tabela em vez de AsyncStorage de proposito: assim a configuracao entra no
 * mesmo arquivo de banco e e levada junto no backup. Comerciante que restaura a
 * caderneta num aparelho novo recupera tambem o nome da loja e o texto de
 * cobranca que ele ajustou — nao so os lancamentos.
 */

export const CHAVES = {
  nomeDaLoja: 'nome_da_loja',
  telefoneDaLoja: 'telefone_da_loja',
  templateCobranca: 'template_cobranca',
  onboardingConcluido: 'onboarding_concluido',
  pinHash: 'pin_hash',
  pinSal: 'pin_sal',
  biometriaAtiva: 'biometria_ativa',
} as const;

export type ChaveConfig = (typeof CHAVES)[keyof typeof CHAVES];

/**
 * O parametro `chave` aceita qualquer string, e nao so `ChaveConfig`: CHAVES
 * lista as chaves do fiado, mas o mecanismo chave/valor e generico e outros
 * apps (ex: orcamento, com as chaves de dados da empresa) tem as suas
 * proprias, definidas localmente.
 */
export async function lerConfig(db: BancoSQLite, chave: string, padrao = ''): Promise<string> {
  const linhas = await db.select().from(config).where(eq(config.chave, chave)).limit(1);
  const linha = linhas[0] as { valor: string } | undefined;
  return linha?.valor ?? padrao;
}

export async function gravarConfig(db: BancoSQLite, chave: string, valor: string): Promise<void> {
  await db
    .insert(config)
    .values({ chave, valor, atualizadoEm: agora() })
    .onConflictDoUpdate({
      target: config.chave,
      set: { valor, atualizadoEm: agora() },
    });
}

/** Consulta reativa: a tela de ajustes e a de cobranca acompanham as mudancas. */
export function consultaConfig(db: BancoSQLite) {
  return db.select().from(config);
}

/** Transforma as linhas da consulta num objeto de acesso direto. */
export function mapearConfig(linhas: { chave: string; valor: string }[]): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const linha of linhas) mapa[linha.chave] = linha.valor;
  return mapa;
}
