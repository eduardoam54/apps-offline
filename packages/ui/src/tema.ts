/**
 * Tema compartilhado pelos apps do monorepo.
 *
 * O usuario destes apps esta EM PE, COM PRESSA, atras de um balcao — as vezes
 * sob sol forte, as vezes numa oficina mal iluminada. Nao esta sentado
 * explorando o app com calma. Cada numero aqui sai dessa premissa:
 *
 *   - corpo de texto em 17pt, nao 15 ou 16
 *   - alvo de toque minimo de 48dp, principal de 56dp
 *   - contraste alto em tudo que carrega numero
 *
 * Modo claro e escuro sao dois `Tema` completos, resolvidos em tempo real pelo
 * esquema de cor do aparelho (ver contexto.tsx). Escuro nao e so "cinza mais
 * escuro": e uma escala de superficies que sobe de luminosidade por camada
 * (fundo < superficie < superficieElevada < superficieElevada2), porque sombra
 * nao se le em fundo escuro — quem sinaliza elevacao la e `bordaCard`.
 */

/**
 * Cor de destaque de cada app, um par claro/escuro. E o unico eixo de
 * identidade que muda entre eles.
 */
export const DESTAQUE = {
  fiado: {
    claro: { primaria: '#0F766E', primariaEscura: '#115E59', primariaClara: '#CCFBF1' },
    escuro: { primaria: '#2DD4BF', primariaEscura: '#0F766E', primariaClara: 'rgba(45, 212, 191, 0.16)' },
  },
  orcamento: {
    claro: { primaria: '#1D4ED8', primariaEscura: '#1E3A8A', primariaClara: '#DBEAFE' },
    escuro: { primaria: '#60A5FA', primariaEscura: '#1D4ED8', primariaClara: 'rgba(96, 165, 250, 0.16)' },
  },
  veiculo: {
    claro: { primaria: '#7C2D12', primariaEscura: '#5C2210', primariaClara: '#FFEDD5' },
    escuro: { primaria: '#FB923C', primariaEscura: '#7C2D12', primariaClara: 'rgba(251, 146, 60, 0.16)' },
  },
} as const;

/**
 * Tipada explicitamente como string, e nao com `as const`: as cores de destaque
 * sao trocadas por cada app em criarTema(), e tipo literal impediria a troca.
 */
export type Cores = {
  primaria: string;
  primariaEscura: string;
  primariaClara: string;
  divida: string;
  dividaFundo: string;
  pago: string;
  pagoFundo: string;
  alerta: string;
  alertaFundo: string;
  texto: string;
  textoSecundario: string;
  textoFraco: string;
  textoInverso: string;
  fundo: string;
  /** Camada 1: fundo de secao (ex: atras de uma lista). */
  superficie: string;
  /** Camada 2: onde os cards vivem. */
  superficieElevada: string;
  /** Camada 3: flutuante — modal, folha, menu. */
  superficieElevada2: string;
  /** Mais funda que `fundo` — usada em campo de texto, reforca "afundado". */
  superficieAfundada: string;
  borda: string;
  bordaForte: string;
  /** Borda sutil de card. Em modo escuro e o principal sinal de elevacao,
   * ja que sombra nao se le em fundo escuro. */
  bordaCard: string;
  desabilitado: string;
  sobreposicao: string;
};

const coresClaras: Cores = {
  primaria: DESTAQUE.fiado.claro.primaria,
  primariaEscura: DESTAQUE.fiado.claro.primariaEscura,
  primariaClara: DESTAQUE.fiado.claro.primariaClara,

  /** Divida / valor a receber. Vermelho e a cor do que falta entrar. */
  divida: '#B91C1C',
  dividaFundo: '#FEE2E2',

  /** Pagamento recebido. */
  pago: '#15803D',
  pagoFundo: '#DCFCE7',

  /** Vencimento proximo, limite de credito estourado. */
  alerta: '#B45309',
  alertaFundo: '#FEF3C7',

  texto: '#111827',
  textoSecundario: '#4B5563',
  textoFraco: '#6B7280',
  textoInverso: '#FFFFFF',

  fundo: '#FFFFFF',
  superficie: '#F9FAFB',
  superficieElevada: '#FFFFFF',
  superficieElevada2: '#FFFFFF',
  superficieAfundada: '#F3F4F6',
  borda: '#E5E7EB',
  bordaForte: '#D1D5DB',
  bordaCard: '#F1F2F4',

  desabilitado: '#9CA3AF',
  sobreposicao: 'rgba(17, 24, 39, 0.45)',
};

const coresEscuras: Cores = {
  primaria: DESTAQUE.fiado.escuro.primaria,
  primariaEscura: DESTAQUE.fiado.escuro.primariaEscura,
  primariaClara: DESTAQUE.fiado.escuro.primariaClara,

  divida: '#F87171',
  dividaFundo: 'rgba(185, 28, 28, 0.18)',

  pago: '#4ADE80',
  pagoFundo: 'rgba(21, 128, 61, 0.18)',

  alerta: '#FBBF24',
  alertaFundo: 'rgba(180, 83, 9, 0.18)',

  texto: '#F3F4F6',
  textoSecundario: '#B8BEC7',
  textoFraco: '#8890A0',
  textoInverso: '#111318',

  fundo: '#111318',
  superficie: '#171A20',
  superficieElevada: '#1E222A',
  superficieElevada2: '#262B34',
  superficieAfundada: '#0C0E12',
  borda: '#2B303B',
  bordaForte: '#3A4150',
  bordaCard: 'rgba(255, 255, 255, 0.08)',

  desabilitado: '#4B5261',
  sobreposicao: 'rgba(0, 0, 0, 0.6)',
};

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pilula: 999,
} as const;

export const fonte = {
  /** Valor em destaque na tela de lancamento. */
  gigante: 44,
  titulo: 28,
  subtitulo: 20,
  /** Padrao de leitura. Maior que o comum de proposito. */
  corpo: 17,
  pequeno: 15,
  micro: 13,
} as const;

export const peso = {
  normal: '400',
  medio: '500',
  forte: '600',
  destaque: '700',
} as const;

/**
 * Tamanhos minimos de area tocavel.
 * 48dp e o minimo das diretrizes de acessibilidade do Android; 56 e o que
 * usamos na acao principal de cada tela, que precisa ser acertada de primeira
 * com o polegar e sem olhar direito.
 */
export const toque = {
  minimo: 48,
  principal: 56,
} as const;

type Sombra = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/**
 * Sombra clara: opacidade real, da o "volume" do card. Sombra escura: quase
 * zero — em fundo escuro sombra nao se ve, quem sinaliza elevacao e a
 * `bordaCard` do proprio componente (ver Cartao.tsx), nao o token de sombra.
 */
function criarSombra(modo: 'claro' | 'escuro'): { card: Sombra; flutuante: Sombra } {
  if (modo === 'escuro') {
    return {
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      flutuante: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      },
    };
  }
  return {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    flutuante: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
  };
}

export type Tema = {
  modo: 'claro' | 'escuro';
  cores: Cores;
  espaco: typeof espaco;
  raio: typeof raio;
  fonte: typeof fonte;
  peso: typeof peso;
  toque: typeof toque;
  sombra: ReturnType<typeof criarSombra>;
};

type DestaqueApp = { primaria: string; primariaEscura: string; primariaClara: string };

/** Monta os dois modos (claro e escuro) de um app trocando so a cor de destaque. */
export function criarTema(destaqueClaro: DestaqueApp, destaqueEscuro: DestaqueApp): { claro: Tema; escuro: Tema } {
  return {
    claro: {
      modo: 'claro',
      cores: { ...coresClaras, ...destaqueClaro },
      espaco,
      raio,
      fonte,
      peso,
      toque,
      sombra: criarSombra('claro'),
    },
    escuro: {
      modo: 'escuro',
      cores: { ...coresEscuras, ...destaqueEscuro },
      espaco,
      raio,
      fonte,
      peso,
      toque,
      sombra: criarSombra('escuro'),
    },
  };
}

export const temaFiado = criarTema(DESTAQUE.fiado.claro, DESTAQUE.fiado.escuro);
export const temaOrcamento = criarTema(DESTAQUE.orcamento.claro, DESTAQUE.orcamento.escuro);
export const temaVeiculo = criarTema(DESTAQUE.veiculo.claro, DESTAQUE.veiculo.escuro);
