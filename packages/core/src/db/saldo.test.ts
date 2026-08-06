import { beforeEach, describe, expect, it } from 'vitest';

import {
  consultaClientesComSaldo,
  consultaItensDaVenda,
  consultaPagamentosDoCliente,
  consultaVendasDoCliente,
  montarExtrato,
  saldoDoCliente,
  totalAReceber,
  type ClienteComSaldo,
} from './consultas';
import { arquivarCliente, criarCliente } from './repos/cliente';
import { excluirPagamento, receberPagamento } from './repos/pagamento';
import { consultaProdutosFrequentes } from './repos/produto';
import { excluirVenda, lancarVenda } from './repos/venda';
import { bancoDeTeste } from './teste-helpers';
import type { BancoSQLite } from './tipos';

let db: BancoSQLite;

beforeEach(() => {
  db = bancoDeTeste();
});

async function clienteTeste(nome = 'Seu João') {
  return criarCliente(db, { nome });
}

describe('saldo do cliente', () => {
  it('comeca em zero', async () => {
    const c = await clienteTeste();
    expect(await saldoDoCliente(db, c.id)).toBe(0);
  });

  it('sobe com a venda e cai com o pagamento', async () => {
    // O roteiro do plano: lancar R$ 42, receber R$ 20, sobrar R$ 22.
    const c = await clienteTeste();

    await lancarVenda(db, { clienteId: c.id, valorCentavos: 4200 });
    expect(await saldoDoCliente(db, c.id)).toBe(4200);

    await receberPagamento(db, { clienteId: c.id, valorCentavos: 2000 });
    expect(await saldoDoCliente(db, c.id)).toBe(2200);
  });

  it('fica negativo quando o cliente paga adiantado', async () => {
    // Saldo negativo e credito, nao erro. Deixar troco adiantado acontece.
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 2500 });

    expect(await saldoDoCliente(db, c.id)).toBe(-1500);
  });

  it('ignora venda excluida', async () => {
    const c = await clienteTeste();
    const v1 = await lancarVenda(db, { clienteId: c.id, valorCentavos: 3000 });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });

    await excluirVenda(db, v1.id);
    expect(await saldoDoCliente(db, c.id)).toBe(1000);
  });

  it('ignora pagamento excluido', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 5000 });
    const p = await receberPagamento(db, { clienteId: c.id, valorCentavos: 2000 });

    expect(await saldoDoCliente(db, c.id)).toBe(3000);
    await excluirPagamento(db, p.id);
    expect(await saldoDoCliente(db, c.id)).toBe(5000);
  });

  it('nao mistura o saldo de clientes diferentes', async () => {
    // Esta e a garantia contra o erro classico de JOIN: se a consulta cruzasse
    // venda com pagamento, os valores de um cliente vazariam para o outro.
    const joao = await criarCliente(db, { nome: 'João' });
    const maria = await criarCliente(db, { nome: 'Maria' });

    await lancarVenda(db, { clienteId: joao.id, valorCentavos: 1000 });
    await lancarVenda(db, { clienteId: joao.id, valorCentavos: 2000 });
    await lancarVenda(db, { clienteId: maria.id, valorCentavos: 500 });
    await receberPagamento(db, { clienteId: joao.id, valorCentavos: 300 });
    await receberPagamento(db, { clienteId: joao.id, valorCentavos: 200 });

    expect(await saldoDoCliente(db, joao.id)).toBe(2500);
    expect(await saldoDoCliente(db, maria.id)).toBe(500);
  });

  it('nao infla o saldo com varias vendas e varios pagamentos', async () => {
    // Com JOIN, 3 vendas x 2 pagamentos viraria 6 linhas e o SUM contaria cada
    // venda duas vezes: daria 12000 em vez de 6000, sem erro aparente.
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 3000 });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 2000 });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 1500 });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 500 });

    expect(await saldoDoCliente(db, c.id)).toBe(4000);
  });
});

describe('venda com itens', () => {
  it('calcula o total a partir dos itens e ignora o valor digitado', async () => {
    const c = await clienteTeste();
    const v = await lancarVenda(db, {
      clienteId: c.id,
      valorCentavos: 99999, // deve ser ignorado
      itens: [
        { descricao: 'Pão francês', quantidadeMilesimos: 6000, valorUnitarioCentavos: 100 },
        { descricao: 'Leite', valorUnitarioCentavos: 550 },
      ],
    });

    expect(v.valorCentavos).toBe(1150);
    expect(await saldoDoCliente(db, c.id)).toBe(1150);
  });

  it('recusa venda de valor zero', async () => {
    const c = await clienteTeste();
    await expect(lancarVenda(db, { clienteId: c.id, valorCentavos: 0 })).rejects.toThrow();
  });
});

describe('total a receber', () => {
  it('soma o saldo de todos os clientes ativos', async () => {
    const joao = await criarCliente(db, { nome: 'João' });
    const maria = await criarCliente(db, { nome: 'Maria' });

    await lancarVenda(db, { clienteId: joao.id, valorCentavos: 4200 });
    await lancarVenda(db, { clienteId: maria.id, valorCentavos: 1000 });
    await receberPagamento(db, { clienteId: joao.id, valorCentavos: 2000 });

    expect(await totalAReceber(db)).toBe(3200);
  });

  it('e zero com a caderneta vazia', async () => {
    expect(await totalAReceber(db)).toBe(0);
  });

  it('deixa de contar o cliente arquivado', async () => {
    const joao = await criarCliente(db, { nome: 'João' });
    const maria = await criarCliente(db, { nome: 'Maria' });
    await lancarVenda(db, { clienteId: joao.id, valorCentavos: 1000 });
    await lancarVenda(db, { clienteId: maria.id, valorCentavos: 2000 });

    expect(await totalAReceber(db)).toBe(3000);

    await arquivarCliente(db, maria.id);
    expect(await totalAReceber(db)).toBe(1000);
    // mas o historico dela continua no banco
    expect(await saldoDoCliente(db, maria.id)).toBe(2000);
  });
});

describe('lista de clientes com saldo', () => {
  it('ordena do maior devedor para o menor', async () => {
    const joao = await criarCliente(db, { nome: 'João' });
    const maria = await criarCliente(db, { nome: 'Maria' });
    const ana = await criarCliente(db, { nome: 'Ana' });

    await lancarVenda(db, { clienteId: joao.id, valorCentavos: 1000 });
    await lancarVenda(db, { clienteId: maria.id, valorCentavos: 5000 });
    await lancarVenda(db, { clienteId: ana.id, valorCentavos: 3000 });

    const linhas = (await consultaClientesComSaldo(db)) as ClienteComSaldo[];
    expect(linhas.map((l) => l.nome)).toEqual(['Maria', 'Ana', 'João']);
    expect(linhas.map((l) => l.saldoCentavos)).toEqual([5000, 3000, 1000]);
  });

  it('nao lista cliente arquivado', async () => {
    const joao = await criarCliente(db, { nome: 'João' });
    await criarCliente(db, { nome: 'Maria' });
    await arquivarCliente(db, joao.id);

    const linhas = (await consultaClientesComSaldo(db)) as ClienteComSaldo[];
    expect(linhas.map((l) => l.nome)).toEqual(['Maria']);
  });

  it('traz a data da ultima compra e do ultimo pagamento', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000, data: '2026-08-01' });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000, data: '2026-08-04' });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 500, data: '2026-08-02' });

    const linhas = (await consultaClientesComSaldo(db)) as ClienteComSaldo[];
    expect(linhas[0]?.ultimaCompra).toBe('2026-08-04');
    expect(linhas[0]?.ultimoPagamento).toBe('2026-08-02');
  });
});

describe('extrato', () => {
  it('junta vendas e pagamentos com o mais recente primeiro', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000, data: '2026-08-01' });
    await receberPagamento(db, { clienteId: c.id, valorCentavos: 400, data: '2026-08-03' });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 2000, data: '2026-08-02' });

    const vendas = await consultaVendasDoCliente(db, c.id);
    const pagamentos = await consultaPagamentosDoCliente(db, c.id);
    const extrato = montarExtrato(vendas as never[], pagamentos as never[]);

    expect(extrato.map((i) => [i.data, i.tipo])).toEqual([
      ['2026-08-03', 'pagamento'],
      ['2026-08-02', 'venda'],
      ['2026-08-01', 'venda'],
    ]);
  });

  it('no mesmo dia, mantem a ordem em que foi lancado', async () => {
    const c = await clienteTeste();
    const primeira = await lancarVenda(db, { clienteId: c.id, valorCentavos: 100, data: '2026-08-05' });
    const segunda = await lancarVenda(db, { clienteId: c.id, valorCentavos: 200, data: '2026-08-05' });

    const vendas = await consultaVendasDoCliente(db, c.id);
    const extrato = montarExtrato(vendas as never[], []);

    expect(extrato.map((i) => i.id)).toEqual([segunda.id, primeira.id]);
  });

  it('nao mostra lancamento excluido', async () => {
    const c = await clienteTeste();
    const v = await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });
    await excluirVenda(db, v.id);

    const vendas = await consultaVendasDoCliente(db, c.id);
    expect(vendas).toHaveLength(0);
  });
});

describe('produtos frequentes', () => {
  it('aprende com os itens lancados', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, {
      clienteId: c.id,
      itens: [
        { descricao: 'Pão francês', valorUnitarioCentavos: 100 },
        { descricao: 'Leite', valorUnitarioCentavos: 550 },
      ],
    });

    const produtos = (await consultaProdutosFrequentes(db)) as { descricao: string; usos: number }[];
    expect(produtos.map((p) => p.descricao).sort()).toEqual(['Leite', 'Pão francês']);
  });

  it('conta os usos e poe o mais usado na frente', async () => {
    const c = await clienteTeste();
    for (let i = 0; i < 3; i++) {
      await lancarVenda(db, {
        clienteId: c.id,
        itens: [{ descricao: 'Pão francês', valorUnitarioCentavos: 100 }],
      });
    }
    await lancarVenda(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Leite', valorUnitarioCentavos: 550 }],
    });

    const produtos = (await consultaProdutosFrequentes(db)) as { descricao: string; usos: number }[];
    expect(produtos[0]?.descricao).toBe('Pão francês');
    expect(produtos[0]?.usos).toBe(3);
    expect(produtos[1]?.usos).toBe(1);
  });

  it('guarda o preco mais recente, nao o primeiro', async () => {
    // Preco de mercado sobe. Sugerir o valor de tres meses atras seria pior do
    // que nao sugerir nada.
    const c = await clienteTeste();
    await lancarVenda(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Leite', valorUnitarioCentavos: 550 }],
    });
    await lancarVenda(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Leite', valorUnitarioCentavos: 620 }],
    });

    const produtos = (await consultaProdutosFrequentes(db)) as {
      descricao: string;
      valorPadraoCentavos: number;
    }[];
    expect(produtos[0]?.valorPadraoCentavos).toBe(620);
  });

  it('nao registra nada quando a venda e so de valor', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 4200 });

    expect(await consultaProdutosFrequentes(db)).toHaveLength(0);
  });
});

describe('itens da venda', () => {
  it('conta os itens no extrato', async () => {
    const c = await clienteTeste();
    await lancarVenda(db, {
      clienteId: c.id,
      itens: [
        { descricao: 'Pão', valorUnitarioCentavos: 100 },
        { descricao: 'Leite', valorUnitarioCentavos: 550 },
      ],
    });
    await lancarVenda(db, { clienteId: c.id, valorCentavos: 1000 });

    const vendas = (await consultaVendasDoCliente(db, c.id)) as { qtdItens: number }[];
    const contagens = vendas.map((v) => v.qtdItens).sort();
    expect(contagens).toEqual([0, 2]);
  });

  it('devolve os itens na ordem digitada', async () => {
    const c = await clienteTeste();
    const v = await lancarVenda(db, {
      clienteId: c.id,
      itens: [
        { descricao: 'Primeiro', valorUnitarioCentavos: 100 },
        { descricao: 'Segundo', valorUnitarioCentavos: 200 },
        { descricao: 'Terceiro', valorUnitarioCentavos: 300 },
      ],
    });

    const itens = (await consultaItensDaVenda(db, v.id)) as { descricao: string }[];
    expect(itens.map((i) => i.descricao)).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });
});

describe('integridade', () => {
  it('recusa venda para cliente que nao existe', async () => {
    // Chave estrangeira ligada no bancoDeTeste, igual ao app.
    await expect(
      lancarVenda(db, { clienteId: 'NAOEXISTE', valorCentavos: 1000 })
    ).rejects.toThrow();
  });

  it('recusa cliente sem nome', async () => {
    await expect(criarCliente(db, { nome: '   ' })).rejects.toThrow();
  });
});
