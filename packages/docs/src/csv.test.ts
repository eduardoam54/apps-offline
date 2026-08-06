import { describe, expect, it } from 'vitest';

import { BOM, celula, csvClientes, csvLancamentos, gerarCsv } from './csv';

describe('celula', () => {
  it('deixa texto simples sem aspas', () => {
    expect(celula('João da Silva')).toBe('João da Silva');
  });

  it('poe aspas quando o texto tem o separador', () => {
    // Sem isso "Pão; leite" viraria duas colunas e empurraria o valor para a
    // coluna errada da planilha inteira daquela linha.
    expect(celula('Pão; leite')).toBe('"Pão; leite"');
  });

  it('duplica a aspa de dentro do campo', () => {
    expect(celula('cerveja "long neck"')).toBe('"cerveja ""long neck"""');
  });

  it('poe aspas quando o texto tem quebra de linha', () => {
    expect(celula('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"');
  });

  it('trata ausencia de valor como campo vazio', () => {
    expect(celula(null)).toBe('');
    expect(celula(undefined)).toBe('');
  });
});

describe('gerarCsv', () => {
  it('comeca com o BOM', () => {
    // Sem BOM o Excel le como ANSI e todo acento vira lixo.
    expect(gerarCsv(['A'], [['x']]).startsWith(BOM)).toBe(true);
  });

  it('separa com ponto e virgula e quebra linha com CRLF', () => {
    const csv = gerarCsv(['A', 'B'], [['1', '2']]);
    expect(csv).toBe(`${BOM}A;B\r\n1;2\r\n`);
  });

  it('gera so o cabecalho quando nao ha linhas', () => {
    expect(gerarCsv(['A', 'B'], [])).toBe(`${BOM}A;B\r\n`);
  });
});

describe('csvLancamentos', () => {
  const lancamentos = [
    {
      cliente: 'João',
      data: '2026-08-05',
      tipo: 'pagamento' as const,
      descricao: null,
      forma: 'pix',
      valorCentavos: 2000,
    },
    {
      cliente: 'Ana',
      data: '2026-08-01',
      tipo: 'venda' as const,
      descricao: 'Pão e leite',
      forma: null,
      valorCentavos: 1250,
    },
  ];

  it('ordena do mais antigo para o mais novo', () => {
    const linhas = csvLancamentos(lancamentos).trimEnd().split('\r\n');
    expect(linhas[1]).toContain('Ana');
    expect(linhas[2]).toContain('João');
  });

  it('escreve o valor com virgula decimal e sem simbolo de moeda', () => {
    // "12,50" o Excel pt-BR soma; "12.50" e "R$ 12,50" viram texto.
    expect(csvLancamentos(lancamentos)).toContain(';12,50');
    expect(csvLancamentos(lancamentos)).not.toContain('R$');
  });

  it('escreve a data no formato brasileiro', () => {
    expect(csvLancamentos(lancamentos)).toContain('01/08/2026');
  });

  it('traduz tipo e forma para o que o comerciante le', () => {
    const csv = csvLancamentos(lancamentos);
    expect(csv).toContain(';Fiado;');
    expect(csv).toContain(';Pagamento;');
    expect(csv).toContain(';Pix;');
  });

  it('exporta pagamento com valor positivo', () => {
    // O sinal fica na coluna Tipo. Ver o comentario de csvLancamentos.
    expect(csvLancamentos(lancamentos)).not.toContain('-20,00');
    expect(csvLancamentos(lancamentos)).toContain('20,00');
  });
});

describe('csvClientes', () => {
  it('exporta saldo e datas de cada cliente', () => {
    const csv = csvClientes([
      {
        nome: 'João',
        telefone: '11987654321',
        saldoCentavos: 4200,
        ultimaCompra: '2026-08-05',
        ultimoPagamento: null,
      },
    ]);

    expect(csv).toContain('João;11987654321;42,00;05/08/2026;');
  });
});
