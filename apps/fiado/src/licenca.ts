import type { Plano } from '@repo/core';
import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

/**
 * Onde o plano do usuario fica guardado.
 *
 * NUM ARQUIVO, E NAO NA TABELA `config`. Essa e a decisao importante deste
 * modulo. A tabela `config` viaja dentro do backup — e assim de proposito, para
 * o comerciante recuperar o nome da loja e o texto de cobranca ao trocar de
 * celular. Mas se o plano morasse la, ele viajaria junto:
 *
 *   - restaurar o backup de um conhecido daria o plano pago de graca
 *   - restaurar um backup antigo, feito antes da compra, TIRARIA o plano de
 *     quem pagou
 *
 * O segundo caso e o grave: cliente pagante perdendo o que comprou por ter
 * usado uma funcao de recuperacao. Fora do banco, o arquivo de licenca fica
 * preso ao aparelho e a compra continua sendo do aparelho e da conta da loja.
 *
 * O arquivo e legivel e editavel por quem tiver acesso ao sistema de arquivos.
 * Isso e aceito: o app e offline por decisao de produto, entao nao existe
 * servidor para conferir nada. Quem sabe editar JSON no Android nao ia pagar de
 * qualquer jeito, e blindar isso custaria a experiencia de quem paga.
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
  // Diretorio de documentos, e nao cache: cache e apagado pelo sistema quando o
  // armazenamento aperta, e perder a licenca rebaixaria quem pagou.
  return new File(Paths.document, ARQUIVO);
}

export function lerLicenca(): Licenca {
  try {
    const f = arquivo();
    if (!f.exists) return GRATIS;

    const dados = JSON.parse(f.textSync()) as Partial<Licenca>;

    // Qualquer coisa diferente de 'pago' cai para gratis. Arquivo corrompido
    // nao pode derrubar o app nem conceder plano por acidente.
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
  /** Falso ate a primeira leitura do arquivo. */
  carregado: boolean;
  carregar: () => void;
  /** Grava e propaga para todas as telas de uma vez. */
  definirPlano: (plano: Plano, origem: 'loja') => void;
};

/**
 * Estado global do plano.
 *
 * Global e nao por tela porque o plano e lido em muitos lugares (lista de
 * clientes, cadastro, exportar, ajustes) e muda quase nunca. Passar isso por
 * propriedade ou reconsultar o arquivo em cada tela seria trabalho a toa.
 *
 * Enquanto `carregado` for falso o app assume GRATIS. Assumir pago e mostrar o
 * recurso liberado por um instante, para depois arrancar, e pior do que o
 * contrario.
 */
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
