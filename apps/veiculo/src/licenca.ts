import type { Plano } from '@repo/core';
import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

/**
 * Onde o plano do usuario fica guardado.
 *
 * NUM ARQUIVO, E NAO NA TABELA `config`. Essa e a decisao importante deste
 * modulo. A tabela `config` viaja dentro do backup — e assim de proposito, para
 * o usuario recuperar os dados ao trocar de celular. Mas se o plano morasse la,
 * ele viajaria junto:
 *
 *   - restaurar o backup de um conhecido daria o plano pago de graca
 *   - restaurar um backup antigo, feito antes da compra, TIRARIA o plano de
 *     quem pagou
 *
 * O segundo caso e o grave: cliente pagante perdendo o que comprou por ter
 * usado uma funcao de recuperacao. Fora do banco, o arquivo de licenca fica
 * preso ao aparelho e a compra continua sendo do aparelho e da conta da loja.
 *
 * Mesma decisao que fiado e orcamento ja tomaram.
 */

const ARQUIVO = 'licenca.json';

export type Licenca = {
  plano: Plano;
  /** Instante ISO em que o plano pago passou a valer. */
  desde: string | null;
  /** De onde veio o desbloqueio. Hoje so a loja desbloqueia. */
  origem: 'loja' | null;
};

const GRATIS: Licenca = { plano: 'gratis', desde: null, origem: null };

function arquivo(): File {
  return new File(Paths.document, ARQUIVO);
}

export function lerLicenca(): Licenca {
  try {
    const f = arquivo();
    if (!f.exists) return GRATIS;

    const dados = JSON.parse(f.textSync()) as Partial<Licenca>;

    return dados.plano === 'pago'
      ? { plano: 'pago', desde: dados.desde ?? null, origem: dados.origem ?? null }
      : GRATIS;
  } catch {
    return GRATIS;
  }
}

export function gravarLicenca(licenca: Licenca): void {
  const f = arquivo();
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(licenca));
}

type EstadoLicenca = {
  plano: Plano;
  carregado: boolean;
  carregar: () => void;
  definirPlano: (plano: Plano, origem: 'loja') => void;
};

export const useLicenca = create<EstadoLicenca>((set) => ({
  plano: 'gratis',
  carregado: false,

  carregar: () => {
    const licenca = lerLicenca();
    set({ plano: licenca.plano, carregado: true });
  },

  definirPlano: (plano, origem) => {
    gravarLicenca({
      plano,
      desde: plano === 'pago' ? new Date().toISOString() : null,
      origem: plano === 'pago' ? origem : null,
    });
    set({ plano, carregado: true });
  },
}));
