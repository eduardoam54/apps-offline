import { describe, expect, it } from 'vitest';

import { htmlExtratoCliente, saldoFinal, type LancamentoExtrato } from './extrato';
import { escaparHtml } from './html';

const LOJA = { nome: 'Mercadinho do Zé', telefone: '11987654321' };
const CLIENTE = { nome: 'João da Silva', telefone: null };

function extrato(lancamentos: LancamentoExtrato[]): string {
  return htmlExtratoCliente({
    loja: LOJA,
    cliente: CLIENTE,
    lancamentos,
    geradoEm: '2026-08-06',
  });
}

/** Le a coluna de saldo acumulado, na ordem em que aparece no documento. */
function saldosAcumulados(html: string): string[] {
  const linhas = html.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  return linhas
    .map((linha) => [...linha.matchAll(/<td class="numero">([^<]*)<\/td>/g)].at(-1)?.[1])
    .filter((v): v is string => v != null);
}

describe('escaparHtml', () => {
  it('escapa o & antes dos outros, senao ele reescreveria as entidades', () => {
    expect(escaparHtml('& <')).toBe('&amp; &lt;');
  });

  it('protege o documento de nome digitado a mao', () => {
    expect(escaparHtml('Bar do Zé & Cia <matriz>')).toBe(
      'Bar do Zé &amp; Cia &lt;matriz&gt;'
    );
  });
});

describe('saldoFinal', () => {
  it('e a soma das vendas menos a soma dos pagamentos', () => {
    expect(
      saldoFinal([
        { tipo: 'venda', data: '2026-08-01', descricao: null, valorCentavos: 5000, criadoEm: 'a' },
        { tipo: 'pagamento', data: '2026-08-02', descricao: null, valorCentavos: 2000, criadoEm: 'b' },
      ])
    ).toBe(3000);
  });

  it('e zero sem lancamento nenhum', () => {
    expect(saldoFinal([])).toBe(0);
  });

  it('fica negativo quando o cliente pagou a mais', () => {
    expect(
      saldoFinal([
        { tipo: 'pagamento', data: '2026-08-02', descricao: null, valorCentavos: 500, criadoEm: 'b' },
      ])
    ).toBe(-500);
  });
});

describe('htmlExtratoCliente', () => {
  const historico: LancamentoExtrato[] = [
    { tipo: 'pagamento', data: '2026-08-05', descricao: null, valorCentavos: 2000, criadoEm: 'c' },
    { tipo: 'venda', data: '2026-08-01', descricao: 'Pão e leite', valorCentavos: 1250, criadoEm: 'a' },
    { tipo: 'venda', data: '2026-08-03', descricao: null, valorCentavos: 3000, criadoEm: 'b' },
  ];

  it('imprime na ordem cronologica, mesmo recebendo fora de ordem', () => {
    const html = extrato(historico);
    expect(html.indexOf('01/08/2026')).toBeLessThan(html.indexOf('03/08/2026'));
    expect(html.indexOf('03/08/2026')).toBeLessThan(html.indexOf('05/08/2026'));
  });

  it('mostra o saldo subindo e descendo lancamento a lancamento', () => {
    expect(saldosAcumulados(extrato(historico))).toEqual([
      'R$ 12,50',
      'R$ 42,50',
      'R$ 22,50',
    ]);
  });

  it('fecha a conta: o total bate com o ultimo saldo acumulado', () => {
    // E o ponto do documento inteiro. Se o rodape discordasse das linhas, o
    // cliente deixaria de acreditar na caderneta.
    const html = extrato(historico);
    expect(saldosAcumulados(html).at(-1)).toBe('R$ 22,50');
    expect(html).toContain('Saldo devedor');
    expect(html).toContain('R$ 22,50');
  });

  it('desempata lancamentos do mesmo dia pela ordem em que foram feitos', () => {
    const html = extrato([
      { tipo: 'venda', data: '2026-08-01', descricao: null, valorCentavos: 1000, criadoEm: 'b' },
      { tipo: 'pagamento', data: '2026-08-01', descricao: null, valorCentavos: 400, criadoEm: 'a' },
    ]);
    expect(saldosAcumulados(html)).toEqual(['-R$ 4,00', 'R$ 6,00']);
  });

  it('chama de credito a favor quando o cliente pagou a mais', () => {
    const html = extrato([
      { tipo: 'venda', data: '2026-08-01', descricao: null, valorCentavos: 1000, criadoEm: 'a' },
      { tipo: 'pagamento', data: '2026-08-02', descricao: null, valorCentavos: 1500, criadoEm: 'b' },
    ]);
    expect(html).toContain('Crédito a favor');
    expect(html).not.toContain('Saldo devedor');
  });

  it('nao mostra tabela vazia quando nao ha lancamento', () => {
    const html = extrato([]);
    expect(html).toContain('Nenhum lançamento registrado');
    expect(html).not.toContain('<table>');
  });

  it('escapa o nome do cliente e a descricao', () => {
    const html = htmlExtratoCliente({
      loja: LOJA,
      cliente: { nome: 'Zé & Cia', telefone: null },
      lancamentos: [
        { tipo: 'venda', data: '2026-08-01', descricao: '2 <caixas>', valorCentavos: 100, criadoEm: 'a' },
      ],
      geradoEm: '2026-08-06',
    });

    expect(html).toContain('Zé &amp; Cia');
    expect(html).toContain('2 &lt;caixas&gt;');
    expect(html).not.toContain('<caixas>');
  });

  it('usa um nome generico quando a loja nao foi preenchida', () => {
    const html = htmlExtratoCliente({
      loja: { nome: '   ', telefone: null },
      cliente: CLIENTE,
      lancamentos: [],
      geradoEm: '2026-08-06',
    });

    expect(html).toContain('Caderneta');
  });
});
