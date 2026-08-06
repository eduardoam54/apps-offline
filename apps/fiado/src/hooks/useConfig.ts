import { CHAVES, consultaConfig, mapearConfig, useConsultaViva } from '@repo/core/db';
import { TEMPLATE_COBRANCA_PADRAO } from '@repo/docs';
import { useMemo } from 'react';

import { db } from '@/db';

export type ConfigDaLoja = {
  nomeDaLoja: string;
  telefoneDaLoja: string;
  templateCobranca: string;
  onboardingConcluido: boolean;
};

/**
 * Configuracao da loja, reativa.
 *
 * Ler por consulta ao vivo em vez de estado global: mexer no template dentro de
 * Ajustes ja reflete na pre-visualizacao e na proxima cobranca, sem nenhum
 * mecanismo de invalidacao.
 */
export function useConfig(): ConfigDaLoja {
  const { data } = useConsultaViva(consultaConfig(db), ['config'], []);

  return useMemo(() => {
    const mapa = mapearConfig((data ?? []) as { chave: string; valor: string }[]);

    return {
      nomeDaLoja: mapa[CHAVES.nomeDaLoja] ?? '',
      telefoneDaLoja: mapa[CHAVES.telefoneDaLoja] ?? '',
      templateCobranca: mapa[CHAVES.templateCobranca] ?? TEMPLATE_COBRANCA_PADRAO,
      onboardingConcluido: mapa[CHAVES.onboardingConcluido] === 'sim',
    };
  }, [data]);
}
