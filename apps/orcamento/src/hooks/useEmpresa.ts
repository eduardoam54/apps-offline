import { consultaConfig, mapearConfig, useConsultaViva } from '@repo/core/db';
import { useMemo } from 'react';

import { db } from '@/db';

/**
 * Chaves proprias deste app na tabela `config` compartilhada. Ficam aqui, e
 * nao em @repo/core, porque o SIGNIFICADO ("dados da empresa") e do produto
 * orcamento — o mecanismo de chave/valor e que e generico.
 */
export const CHAVES_EMPRESA = {
  nome: 'empresa_nome',
  telefone: 'empresa_telefone',
  documento: 'empresa_documento',
  logoUri: 'empresa_logo_uri',
} as const;

export type DadosEmpresa = {
  nome: string;
  telefone: string;
  documento: string;
  logoUri: string;
  carregado: boolean;
};

export function useEmpresa(): DadosEmpresa {
  const { data, carregado } = useConsultaViva(consultaConfig(db), ['config'], []);

  return useMemo(() => {
    const mapa = mapearConfig((data ?? []) as { chave: string; valor: string }[]);
    return {
      nome: mapa[CHAVES_EMPRESA.nome] ?? '',
      telefone: mapa[CHAVES_EMPRESA.telefone] ?? '',
      documento: mapa[CHAVES_EMPRESA.documento] ?? '',
      logoUri: mapa[CHAVES_EMPRESA.logoUri] ?? '',
      carregado,
    };
  }, [data, carregado]);
}
