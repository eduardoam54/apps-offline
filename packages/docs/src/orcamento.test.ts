import { describe, expect, it } from 'vitest';

import { htmlOrcamento, type DadosOrcamentoDocumento } from './orcamento';

const EMPRESA = { nome: 'João Eletricista', telefone: '11987654321', documento: '123.456.789-00' };
const CLIENTE = { nome: 'Maria da Silva', telefone: null };

function base(sobrepor: Partial<DadosOrcamentoDocumento> = {}): DadosOrcamentoDocumento {
  return {
    empresa: EMPRESA,
    cliente: CLIENTE,
    numero: 1,
    data: '2026-08-06',
    itens: [{ descricao: 'Instalação de tomada', quantidadeMilesimos: 1000, valorUnitarioCentavos: 5000 }],
    descontoCentavos: 0,
    totalCentavos: 5000,
    observacoes: null,
    marcaDagua: false,
    ...sobrepor,
  };
}

describe('htmlOrcamento', () => {
  it('escapa nome de cliente e item digitados a mao', () => {
    const html = htmlOrcamento(
      base({
        cliente: { nome: 'Bar do Zé & Cia', telefone: null },
        itens: [{ descricao: 'Fio <2,5mm>', quantidadeMilesimos: 1000, valorUnitarioCentavos: 200 }],
      })
    );
    expect(html).toContain('Bar do Zé &amp; Cia');
    expect(html).toContain('Fio &lt;2,5mm&gt;');
    expect(html).not.toContain('Bar do Zé & Cia');
  });

  it('mostra o total, e o desconto so aparece quando maior que zero', () => {
    const semDesconto = htmlOrcamento(base());
    expect(semDesconto).toContain('R$ 50,00');
    expect(semDesconto).not.toContain('Desconto');

    const comDesconto = htmlOrcamento(base({ descontoCentavos: 500, totalCentavos: 4500 }));
    expect(comDesconto).toContain('Desconto');
    expect(comDesconto).toContain('R$ 45,00');
  });

  it('marca dagua so aparece no plano gratuito', () => {
    expect(htmlOrcamento(base({ marcaDagua: false }))).not.toContain('Versão gratuita');
    expect(htmlOrcamento(base({ marcaDagua: true }))).toContain('Versão gratuita');
  });

  it('logo so aparece quando fornecida', () => {
    expect(htmlOrcamento(base())).not.toContain('<img');
    expect(htmlOrcamento(base({ logoBase64: 'QUJD' }))).toContain('data:image/png;base64,QUJD');
  });

  it('observacoes so aparecem quando preenchidas', () => {
    expect(htmlOrcamento(base())).not.toContain('Observações');
    expect(htmlOrcamento(base({ observacoes: 'Pago em até 2x' }))).toContain('Pago em até 2x');
  });

  it('soma o item pela quantidade em milesimos', () => {
    const html = htmlOrcamento(
      base({
        itens: [{ descricao: 'Fio', quantidadeMilesimos: 2500, valorUnitarioCentavos: 200 }],
        totalCentavos: 500,
      })
    );
    // 2,5 * R$ 2,00 = R$ 5,00
    expect(html).toContain('R$ 5,00');
  });
});
