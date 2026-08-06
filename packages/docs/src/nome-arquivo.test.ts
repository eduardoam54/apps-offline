import { describe, expect, it } from 'vitest';

import { nomeDoArquivo, paraNomeDeArquivo } from './nome-arquivo';

describe('paraNomeDeArquivo', () => {
  it('tira acento e troca espaco por hifen', () => {
    expect(paraNomeDeArquivo('João da Silva')).toBe('joao-da-silva');
    expect(paraNomeDeArquivo('Açougue São Jorge')).toBe('acougue-sao-jorge');
  });

  it('nao deixa hifen sobrando nas pontas', () => {
    expect(paraNomeDeArquivo('  Zé & Cia!  ')).toBe('ze-cia');
  });

  it('corta nome muito longo', () => {
    expect(paraNomeDeArquivo('a'.repeat(80))).toHaveLength(40);
  });

  it('devolve vazio quando nao sobra nada utilizavel', () => {
    expect(paraNomeDeArquivo('🎉')).toBe('');
  });
});

describe('nomeDoArquivo', () => {
  it('usa data ordenavel para o arquivo nao se perder na pasta', () => {
    expect(nomeDoArquivo('fiado-lancamentos', 'csv', new Date(2026, 7, 6))).toBe(
      'fiado-lancamentos-2026-08-06.csv'
    );
  });
});
