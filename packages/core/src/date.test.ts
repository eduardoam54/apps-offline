import { describe, expect, it } from 'vitest';

import {
  adicionarDias,
  adicionarMeses,
  diasEntre,
  ehDataISOValida,
  formatarDataBR,
  formatarDataRelativa,
  limitesDoMes,
  paraDataISO,
} from './date';

describe('paraDataISO', () => {
  it('usa o fuso local, nao UTC', () => {
    // Uma venda lancada as 21h de 5/8 no Brasil (UTC-3) e 6/8 em UTC. Se
    // usassemos toISOString() ela cairia no dia errado do extrato.
    const noite = new Date(2026, 7, 5, 21, 30);
    expect(paraDataISO(noite)).toBe('2026-08-05');
  });
});

describe('ehDataISOValida', () => {
  it('aceita data real e recusa data inexistente', () => {
    expect(ehDataISOValida('2026-08-05')).toBe(true);
    expect(ehDataISOValida('2026-02-30')).toBe(false);
    expect(ehDataISOValida('05/08/2026')).toBe(false);
    expect(ehDataISOValida('')).toBe(false);
  });
});

describe('formatarDataBR', () => {
  it('converte para o formato que o comerciante le', () => {
    expect(formatarDataBR('2026-08-05')).toBe('05/08/2026');
  });
});

describe('formatarDataRelativa', () => {
  it('nomeia os dias recentes', () => {
    expect(formatarDataRelativa('2026-08-05', '2026-08-05')).toBe('hoje');
    expect(formatarDataRelativa('2026-08-04', '2026-08-05')).toBe('ontem');
    expect(formatarDataRelativa('2026-07-30', '2026-08-05')).toBe('30/07/2026');
  });
});

describe('diasEntre', () => {
  it('conta dias inteiros', () => {
    expect(diasEntre('2026-08-01', '2026-08-05')).toBe(4);
    expect(diasEntre('2026-08-05', '2026-08-05')).toBe(0);
    expect(diasEntre('2026-08-05', '2026-08-01')).toBe(-4);
  });

  it('atravessa virada de mes e de ano', () => {
    expect(diasEntre('2026-01-30', '2026-02-02')).toBe(3);
    expect(diasEntre('2025-12-30', '2026-01-02')).toBe(3);
  });
});

describe('adicionarMeses', () => {
  it('preserva o dia quando ele existe no mes destino', () => {
    expect(adicionarMeses('2026-08-05', 1)).toBe('2026-09-05');
    expect(adicionarMeses('2026-08-05', 3)).toBe('2026-11-05');
  });

  it('encaixa no ultimo dia quando o mes destino e mais curto', () => {
    // Sem esse cuidado, 31/01 + 1 mes viraria 03/03 e o vencimento da parcela
    // pularia de mes sozinho.
    expect(adicionarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(adicionarMeses('2024-01-31', 1)).toBe('2024-02-29'); // bissexto
    expect(adicionarMeses('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('atravessa o ano', () => {
    expect(adicionarMeses('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('gera vencimentos mensais consistentes a partir do dia 31', () => {
    // Cada parcela e calculada a partir da data ORIGINAL, nao da anterior —
    // por isso o dia 31 se recupera nos meses que o comportam.
    const base = '2026-01-31';
    const vencimentos = [1, 2, 3].map((n) => adicionarMeses(base, n));
    expect(vencimentos).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });
});

describe('adicionarDias', () => {
  it('soma e subtrai dias', () => {
    expect(adicionarDias('2026-08-05', 30)).toBe('2026-09-04');
    expect(adicionarDias('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('limitesDoMes', () => {
  it('devolve o primeiro e o ultimo dia', () => {
    expect(limitesDoMes('2026-02-10')).toEqual({
      inicio: '2026-02-01',
      fim: '2026-02-28',
    });
    expect(limitesDoMes('2026-08-05')).toEqual({
      inicio: '2026-08-01',
      fim: '2026-08-31',
    });
  });
});
