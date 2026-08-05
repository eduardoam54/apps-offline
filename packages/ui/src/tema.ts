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
 * Modo escuro fica fora da v1 de proposito: garantir contraste em dois temas
 * dobra o trabalho de revisao visual sem resolver nenhuma dor do comerciante.
 */

/** Cor de destaque de cada app. E o unico eixo de identidade que muda entre eles. */
export const DESTAQUE = {
  fiado: '#0F766E',
  orcamento: '#1D4ED8',
  veiculo: '#7C2D12',
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
  superficie: string;
  superficieAfundada: string;
  borda: string;
  bordaForte: string;
  desabilitado: string;
  sobreposicao: string;
};

export const cores: Cores = {
  /** Substituido por cada app via criarTema(). */
  primaria: DESTAQUE.fiado,
  primariaEscura: '#115E59',
  primariaClara: '#CCFBF1',

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
  superficieAfundada: '#F3F4F6',
  borda: '#E5E7EB',
  bordaForte: '#D1D5DB',

  desabilitado: '#9CA3AF',
  sobreposicao: 'rgba(17, 24, 39, 0.45)',
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

export const sombra = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  flutuante: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export type Tema = {
  cores: Cores;
  espaco: typeof espaco;
  raio: typeof raio;
  fonte: typeof fonte;
  peso: typeof peso;
  toque: typeof toque;
  sombra: typeof sombra;
};

/** Monta o tema de um app trocando apenas a cor de destaque. */
export function criarTema(destaque: string, destaqueEscura: string, destaqueClara: string): Tema {
  return {
    cores: {
      ...cores,
      primaria: destaque,
      primariaEscura: destaqueEscura,
      primariaClara: destaqueClara,
    },
    espaco,
    raio,
    fonte,
    peso,
    toque,
    sombra,
  };
}

export const temaFiado = criarTema(DESTAQUE.fiado, '#115E59', '#CCFBF1');
