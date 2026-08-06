import { describe, expect, it } from 'vitest';

import { formatarTelefone, htmlRelatorioDevedores, type Devedor } from './relatorio';

const LOJA = { nome: 'Mercadinho do Zé', telefone: null };

function relatorio(clientes: Devedor[]): string {
  return htmlRelatorioDevedores({ loja: LOJA, clientes, geradoEm: '2026-08-06' });
}

describe('formatarTelefone', () => {
  it('formata celular e fixo', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(formatarTelefone('1132654321')).toBe('(11) 3265-4321');
  });

  it('devolve o que tem quando o numero nao encaixa', () => {
    expect(formatarTelefone('123')).toBe('123');
    expect(formatarTelefone(null)).toBe('');
  });
});

describe('htmlRelatorioDevedores', () => {
  const clientes: Devedor[] = [
    { nome: 'Ana', telefone: null, saldoCentavos: 1000, ultimaCompra: '2026-08-01' },
    { nome: 'João', telefone: '11987654321', saldoCentavos: 5000, ultimaCompra: null },
    { nome: 'Maria', telefone: null, saldoCentavos: 0, ultimaCompra: '2026-07-20' },
    { nome: 'Pedro', telefone: null, saldoCentavos: -300, ultimaCompra: null },
  ];

  it('lista do maior devedor para o menor', () => {
    const html = relatorio(clientes);
    expect(html.indexOf('João')).toBeLessThan(html.indexOf('Ana'));
  });

  it('deixa de fora quem nao deve nada', () => {
    // Cliente zerado ou com credito a favor num relatorio chamado "clientes
    // devendo" so faz o comerciante procurar mais.
    const html = relatorio(clientes);
    expect(html).not.toContain('Maria');
    expect(html).not.toContain('Pedro');
  });

  it('soma o total so de quem entrou na lista', () => {
    expect(relatorio(clientes)).toContain('R$ 60,00');
  });

  it('conta quantos estao devendo', () => {
    expect(relatorio(clientes)).toContain('2 clientes devendo');
    expect(relatorio([clientes[1]!])).toContain('1 cliente devendo');
  });

  it('mostra traco quando o cliente nunca comprou', () => {
    expect(relatorio([clientes[1]!])).toContain('—');
  });

  it('avisa quando a caderneta esta zerada', () => {
    const html = relatorio([]);
    expect(html).toContain('Ninguém está devendo');
    expect(html).not.toContain('<table>');
  });
});
