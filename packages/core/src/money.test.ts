import { describe, expect, it } from 'vitest';

import {
  dividirParcelas,
  formatarBRL,
  formatarNumero,
  parseValorBR,
  somar,
  subtrair,
  totalDoItem,
} from './money';

describe('parseValorBR', () => {
  it('entende o que o comerciante realmente digita', () => {
    expect(parseValorBR('12,50')).toBe(1250);
    expect(parseValorBR('12.50')).toBe(1250);
    expect(parseValorBR('R$ 12,50')).toBe(1250);
    expect(parseValorBR('0,05')).toBe(5);
    expect(parseValorBR(',50')).toBe(50);
    expect(parseValorBR('12,')).toBe(1200);
  });

  it('trata numero sem separador como reais inteiros', () => {
    // Quem digita "42" quer R$ 42,00, nao 42 centavos.
    expect(parseValorBR('42')).toBe(4200);
    expect(parseValorBR('1234')).toBe(123400);
  });

  it('distingue separador de milhar de separador decimal', () => {
    expect(parseValorBR('1.234,56')).toBe(123456);
    expect(parseValorBR('1.234')).toBe(123400); // mil duzentos e trinta e quatro reais
    expect(parseValorBR('1,23')).toBe(123); // um real e vinte e tres centavos
    expect(parseValorBR('1.234.567')).toBe(123456700);
    expect(parseValorBR('1.23')).toBe(123); // ponto com 2 casas e decimal
    expect(parseValorBR('100.00')).toBe(10000);
  });

  it('trata virgula como decimal mesmo com 3 digitos depois', () => {
    // Em portugues a virgula NUNCA e separador de milhar. "12,555" nao e doze
    // mil quinhentos e cinquenta e cinco reais — e um valor mal digitado.
    expect(parseValorBR('12,555')).toBeNull();
    expect(parseValorBR('1,234')).toBeNull();
  });

  it('devolve null quando nao da para interpretar', () => {
    expect(parseValorBR('')).toBeNull();
    expect(parseValorBR('abc')).toBeNull();
    expect(parseValorBR('12,555')).toBeNull(); // 3 casas decimais nao existe em real
    expect(parseValorBR('R$')).toBeNull();
  });

  it('distingue zero de valor invalido', () => {
    // "0" e uma resposta valida; null significa "nao entendi". Sao coisas
    // diferentes e o chamador precisa poder separar as duas.
    expect(parseValorBR('0')).toBe(0);
    expect(parseValorBR('0,00')).toBe(0);
  });
});

describe('formatarNumero / formatarBRL', () => {
  it('formata no padrao brasileiro', () => {
    expect(formatarNumero(1250)).toBe('12,50');
    expect(formatarNumero(5)).toBe('0,05');
    expect(formatarNumero(0)).toBe('0,00');
    expect(formatarNumero(123456)).toBe('1.234,56');
    expect(formatarNumero(100000000)).toBe('1.000.000,00');
  });

  it('mantem o sinal antes do simbolo', () => {
    expect(formatarNumero(-1250)).toBe('-12,50');
    expect(formatarBRL(1250)).toBe('R$ 12,50');
    expect(formatarBRL(-1250)).toBe('-R$ 12,50');
  });

  it('ida e volta nao perde centavo', () => {
    for (const centavos of [0, 1, 99, 100, 1250, 123456, 99999999]) {
      expect(parseValorBR(formatarNumero(centavos))).toBe(centavos);
    }
  });

  it('recusa valor que nao seja centavo inteiro', () => {
    expect(() => formatarNumero(12.5)).toThrow();
  });
});

describe('somar / subtrair', () => {
  it('soma sem erro de ponto flutuante', () => {
    // O caso classico: 0.1 + 0.2 !== 0.3 em float. Em centavos, 10 + 20 === 30.
    expect(somar(10, 20)).toBe(30);
    expect(somar(1250, 999, 1)).toBe(2250);
    expect(somar()).toBe(0);
  });

  it('recusa entrada que nao seja inteiro', () => {
    expect(() => somar(12.5, 10)).toThrow();
  });

  it('subtrai permitindo resultado negativo', () => {
    // Saldo negativo e valido: significa que o cliente pagou adiantado.
    expect(subtrair(1000, 2500)).toBe(-1500);
  });
});

describe('totalDoItem', () => {
  it('multiplica valor unitario por quantidade em milesimos', () => {
    expect(totalDoItem(250, 1000)).toBe(250); // 1 un a R$ 2,50
    expect(totalDoItem(250, 3000)).toBe(750); // 3 un a R$ 2,50
    expect(totalDoItem(2590, 500)).toBe(1295); // 0,5 kg a R$ 25,90
  });

  it('arredonda a fracao de centavo', () => {
    // 0,350 kg a R$ 25,90/kg = R$ 9,065 -> R$ 9,07
    expect(totalDoItem(2590, 350)).toBe(907);
  });

  it('recusa quantidade fracionaria', () => {
    expect(() => totalDoItem(250, 1.5)).toThrow();
  });
});

describe('dividirParcelas', () => {
  it('poe o resto na ultima parcela', () => {
    expect(dividirParcelas(10000, 3)).toEqual([3333, 3333, 3334]);
    expect(dividirParcelas(100, 3)).toEqual([33, 33, 34]);
  });

  it('divide exato quando nao ha resto', () => {
    expect(dividirParcelas(10000, 4)).toEqual([2500, 2500, 2500, 2500]);
    expect(dividirParcelas(9999, 1)).toEqual([9999]);
  });

  it('a soma das parcelas e SEMPRE igual ao total', () => {
    // A garantia que impede o app de inventar ou sumir com centavo.
    for (let total = 0; total <= 5000; total += 7) {
      for (let n = 1; n <= 12; n++) {
        const parcelas = dividirParcelas(total, n);
        expect(parcelas).toHaveLength(n);
        expect(somar(...parcelas)).toBe(total);
      }
    }
  });

  it('recusa entradas sem sentido', () => {
    expect(() => dividirParcelas(1000, 0)).toThrow();
    expect(() => dividirParcelas(1000, -3)).toThrow();
    expect(() => dividirParcelas(-1000, 3)).toThrow();
  });
});
