import { beforeEach, describe, expect, it } from 'vitest';

import { listarLancamentosParaExportar } from './consultas';
import { arquivarCliente, criarCliente } from './repos/cliente';
import { excluirPagamento, receberPagamento } from './repos/pagamento';
import { excluirVenda, lancarVenda } from './repos/venda';
import { bancoDeTeste } from './teste-helpers';
import type { BancoSQLite } from './tipos';

let db: BancoSQLite;

beforeEach(() => {
  db = bancoDeTeste();
});

describe('listarLancamentosParaExportar', () => {
  it('nao infla as linhas quando o cliente tem venda e pagamento', async () => {
    // O teste que existe por causa do produto cartesiano: com um JOIN unico
    // ligando venda E pagamento, 3 vendas e 2 pagamentos virariam 6 linhas de
    // cada lado e a planilha mostraria uma divida tres vezes maior.
    const c = await criarCliente(db, { nome: 'Seu João' });

    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 2000 });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 3000 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 500 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 700 });

    const linhas = await listarLancamentosParaExportar(db);

    expect(linhas).toHaveLength(5);
    expect(linhas.filter((l) => l.tipo === 'venda')).toHaveLength(3);

    const vendas = linhas.filter((l) => l.tipo === 'venda').reduce((s, l) => s + l.valorCentavos, 0);
    const pagos = linhas.filter((l) => l.tipo === 'pagamento').reduce((s, l) => s + l.valorCentavos, 0);
    expect(vendas - pagos).toBe(4800);
  });

  it('traz o nome do cliente em cada linha', async () => {
    const ana = await criarCliente(db, { nome: 'Ana' });
    const joao = await criarCliente(db, { nome: 'João' });

    await lancarVenda(db, { clienteId: ana.id, valorCentavos: 1000 });
    await receberPagamento(db, { clienteId: joao.id, valorCentavos: 500, forma: 'pix' });

    const linhas = await listarLancamentosParaExportar(db);

    expect(linhas.find((l) => l.tipo === 'venda')?.cliente).toBe('Ana');
    expect(linhas.find((l) => l.tipo === 'pagamento')?.cliente).toBe('João');
  });

  it('leva a forma so no pagamento', async () => {
    const c = await criarCliente(db, { nome: 'Ana' });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 500, forma: 'cartao' });

    const linhas = await listarLancamentosParaExportar(db);

    expect(linhas.find((l) => l.tipo === 'venda')?.forma).toBeNull();
    expect(linhas.find((l) => l.tipo === 'pagamento')?.forma).toBe('cartao');
  });

  it('ignora o que foi excluido', async () => {
    const c = await criarCliente(db, { nome: 'Ana' });
    const v = await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    const p = await receberPagamento(db, { clienteId: c.id, valorCentavos: 500 });

    await excluirVenda(db, v.id);
    await excluirPagamento(db, p.id);

    expect(await listarLancamentosParaExportar(db)).toHaveLength(0);
  });

  it('mantem o historico de cliente arquivado', async () => {
    // Arquivar e "esse nao esta mais na minha lista", nao "essa venda nunca
    // aconteceu". A planilha e historico e precisa fechar com a realidade.
    const c = await criarCliente(db, { nome: 'Ana' });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await arquivarCliente(db, c.id);

    const linhas = await listarLancamentosParaExportar(db);

    expect(linhas).toHaveLength(1);
    expect(linhas[0]?.cliente).toBe('Ana');
  });

  it('devolve lista vazia em caderneta vazia', async () => {
    expect(await listarLancamentosParaExportar(db)).toEqual([]);
  });
});
