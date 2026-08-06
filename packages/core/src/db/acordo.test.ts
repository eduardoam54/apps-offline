import { beforeEach, describe, expect, it } from 'vitest';

import { somar } from '../money';
import { saldoDoCliente } from './consultas';
import {
  buscarAcordoAtivo,
  calcularVencimento,
  consultaAcordosDoCliente,
  consultaParcelasDoAcordo,
  consultaParcelasVencidas,
  criarAcordo,
  proximaParcela,
  quebrarAcordo,
  quitarParcela,
} from './repos/acordo';
import { criarCliente } from './repos/cliente';
import { lancarVenda } from './repos/venda';
import { bancoDeTeste } from './teste-helpers';
import type { BancoSQLite } from './tipos';
import type { Acordo, AcordoParcela } from './schema';

let db: BancoSQLite;

beforeEach(() => {
  db = bancoDeTeste();
});

/** Cliente devendo R$ 300, o cenario base de todo teste de acordo. */
async function clienteDevendo(valor = 30000) {
  const c = await criarCliente(db, { nome: 'Seu João' });
  await lancarVenda(db, { clienteId: c.id, valorCentavos: valor });
  return c;
}

describe('acordo nao cria divida', () => {
  it('criar acordo NAO altera o saldo', async () => {
    // O erro que este teste existe para impedir: se o acordo lancasse valor
    // proprio, o cliente que deve R$ 300 passaria a dever R$ 600 e o
    // comerciante cobraria o dobro sem nenhum aviso.
    const c = await clienteDevendo(30000);
    expect(await saldoDoCliente(db, c.id)).toBe(30000);

    await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    expect(await saldoDoCliente(db, c.id)).toBe(30000);
  });

  it('quebrar o acordo tambem nao mexe no saldo', async () => {
    const c = await clienteDevendo(30000);
    const { acordo } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    await quebrarAcordo(db, acordo.id);
    expect(await saldoDoCliente(db, c.id)).toBe(30000);
  });
});

describe('geracao das parcelas', () => {
  it('a soma das parcelas e exatamente o total', async () => {
    const c = await clienteDevendo(10000);
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    expect(parcelas.map((p) => p.valorCentavos)).toEqual([3333, 3333, 3334]);
    expect(somar(...parcelas.map((p) => p.valorCentavos))).toBe(10000);
  });

  it('numera as parcelas a partir de 1', async () => {
    const c = await clienteDevendo();
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    expect(parcelas.map((p) => p.numero)).toEqual([1, 2, 3]);
  });

  it('vence de mes em mes a partir do primeiro vencimento', async () => {
    const c = await clienteDevendo();
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    expect(parcelas.map((p) => p.vencimento)).toEqual(['2026-09-05', '2026-10-05', '2026-11-05']);
  });

  it('conta sempre do primeiro vencimento, nunca do anterior', async () => {
    // Encadeando, um acordo comecado em 31/01 viraria 28/02, 28/03, 28/04 — o
    // dia 31 se perderia na primeira vez que caisse num mes curto e nunca mais
    // voltaria.
    expect(calcularVencimento('2026-01-31', 0, 'mensal')).toBe('2026-01-31');
    expect(calcularVencimento('2026-01-31', 1, 'mensal')).toBe('2026-02-28');
    expect(calcularVencimento('2026-01-31', 2, 'mensal')).toBe('2026-03-31');
    expect(calcularVencimento('2026-01-31', 3, 'mensal')).toBe('2026-04-30');
  });

  it('aceita periodicidade semanal e quinzenal', async () => {
    expect(calcularVencimento('2026-09-05', 2, 'semanal')).toBe('2026-09-19');
    expect(calcularVencimento('2026-09-05', 2, 'quinzenal')).toBe('2026-10-05');
  });

  it('recusa acordo sem sentido', async () => {
    const c = await clienteDevendo();
    const base = { clienteId: c.id, primeiroVencimento: '2026-09-05' };

    await expect(
      criarAcordo(db, { ...base, valorTotalCentavos: 0, numParcelas: 3 })
    ).rejects.toThrow();
    await expect(
      criarAcordo(db, { ...base, valorTotalCentavos: 30000, numParcelas: 0 })
    ).rejects.toThrow();
  });
});

describe('quitar parcela', () => {
  it('abate o saldo uma vez so', async () => {
    const c = await clienteDevendo(10000);
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    await quitarParcela(db, parcelas[0]!.id, { data: '2026-09-05' });
    expect(await saldoDoCliente(db, c.id)).toBe(10000 - 3333);
  });

  it('quitando tudo, o saldo zera e o acordo vira cumprido', async () => {
    const c = await clienteDevendo(10000);
    const { acordo, parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    for (const parcela of parcelas) {
      await quitarParcela(db, parcela.id, { data: '2026-09-05' });
    }

    expect(await saldoDoCliente(db, c.id)).toBe(0);

    const acordos = (await consultaAcordosDoCliente(db, c.id)) as Acordo[];
    expect(acordos[0]?.status).toBe('cumprido');
    expect(await buscarAcordoAtivo(db, c.id)).toBeNull();
    expect(acordo.status).toBe('ativo'); // o objeto devolvido na criacao nao muda
  });

  it('recusa quitar a mesma parcela duas vezes', async () => {
    // Sem essa guarda, tocar duas vezes no botao abateria o dobro do saldo.
    const c = await clienteDevendo(10000);
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 2,
      primeiroVencimento: '2026-09-05',
    });

    await quitarParcela(db, parcelas[0]!.id);
    await expect(quitarParcela(db, parcelas[0]!.id)).rejects.toThrow();
    expect(await saldoDoCliente(db, c.id)).toBe(10000 - 5000);
  });

  it('marca a parcela como paga na data informada', async () => {
    const c = await clienteDevendo(10000);
    const { acordo, parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 2,
      primeiroVencimento: '2026-09-05',
    });

    await quitarParcela(db, parcelas[0]!.id, { data: '2026-09-07' });

    const doBanco = (await consultaParcelasDoAcordo(db, acordo.id)) as AcordoParcela[];
    expect(doBanco[0]?.pagoEm).toBe('2026-09-07');
    expect(doBanco[1]?.pagoEm).toBeNull();
  });
});

describe('proxima parcela', () => {
  it('devolve a primeira em aberto', async () => {
    const c = await clienteDevendo();
    const { acordo, parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-09-05',
    });

    expect((await proximaParcela(db, acordo.id))?.numero).toBe(1);
    await quitarParcela(db, parcelas[0]!.id);
    expect((await proximaParcela(db, acordo.id))?.numero).toBe(2);
  });

  it('devolve null quando nao sobra nenhuma', async () => {
    const c = await clienteDevendo(10000);
    const { acordo, parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 10000,
      numParcelas: 1,
      primeiroVencimento: '2026-09-05',
    });

    await quitarParcela(db, parcelas[0]!.id);
    expect(await proximaParcela(db, acordo.id)).toBeNull();
  });
});

describe('parcelas vencidas', () => {
  it('encontra parcela em aberto com vencimento passado', async () => {
    const c = await clienteDevendo();
    await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-08-01',
    });

    const vencidas = (await consultaParcelasVencidas(db, '2026-09-10')) as {
      numero: number;
      clienteNome: string;
    }[];

    // 01/08 e 01/09 ja venceram; 01/10 ainda nao.
    expect(vencidas.map((v) => v.numero)).toEqual([1, 2]);
    expect(vencidas[0]?.clienteNome).toBe('Seu João');
  });

  it('ignora parcela ja paga', async () => {
    const c = await clienteDevendo();
    const { parcelas } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-08-01',
    });

    await quitarParcela(db, parcelas[0]!.id);

    const vencidas = (await consultaParcelasVencidas(db, '2026-09-10')) as { numero: number }[];
    expect(vencidas.map((v) => v.numero)).toEqual([2]);
  });

  it('ignora acordo quebrado', async () => {
    const c = await clienteDevendo();
    const { acordo } = await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 3,
      primeiroVencimento: '2026-08-01',
    });

    await quebrarAcordo(db, acordo.id);
    expect(await consultaParcelasVencidas(db, '2026-09-10')).toHaveLength(0);
  });

  it('nao considera vencida a parcela que vence hoje', async () => {
    const c = await clienteDevendo();
    await criarAcordo(db, {
      clienteId: c.id,
      valorTotalCentavos: 30000,
      numParcelas: 1,
      primeiroVencimento: '2026-09-10',
    });

    expect(await consultaParcelasVencidas(db, '2026-09-10')).toHaveLength(0);
    expect(await consultaParcelasVencidas(db, '2026-09-11')).toHaveLength(1);
  });
});
