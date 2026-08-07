import { beforeEach, describe, expect, it } from 'vitest';

import { criarCliente } from './repos/cliente';
import {
  aprovarOrcamento,
  atualizarOrcamento,
  buscarOrcamento,
  criarOrcamento,
  duplicarOrcamento,
  excluirOrcamento,
  itensDoOrcamento,
  reabrirOrcamento,
  recusarOrcamento,
  restaurarOrcamento,
} from './repos/orcamento';
import { bancoDeTeste } from './teste-helpers';
import type { BancoSQLite } from './tipos';

let db: BancoSQLite;

beforeEach(() => {
  db = bancoDeTeste();
});

async function clienteQualquer(nome = 'Fulano Eletricista') {
  return criarCliente(db, { nome });
}

describe('criarOrcamento', () => {
  it('total e sempre recalculado a partir dos itens, ignorando qualquer valor digitado a parte', async () => {
    const c = await clienteQualquer();
    const { orcamento, itens } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [
        { descricao: 'Instalação de tomada', valorUnitarioCentavos: 5000 },
        { descricao: 'Fio 2,5mm', quantidadeMilesimos: 3000, valorUnitarioCentavos: 200 },
      ],
    });

    // 5000 + (3 * 200) = 5600
    expect(orcamento.totalCentavos).toBe(5600);
    expect(itens).toHaveLength(2);
  });

  it('desconto abate do total', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      descontoCentavos: 600,
      itens: [{ descricao: 'Mão de obra', valorUnitarioCentavos: 5600 }],
    });

    expect(orcamento.totalCentavos).toBe(5000);
  });

  it('nao deixa o total ficar negativo — desconto maior que os itens vira zero, e isso e erro', async () => {
    const c = await clienteQualquer();
    await expect(
      criarOrcamento(db, {
        clienteId: c.id,
        descontoCentavos: 10000,
        itens: [{ descricao: 'Mão de obra', valorUnitarioCentavos: 5000 }],
      })
    ).rejects.toThrow('total precisa ser maior que zero');
  });

  it('exige pelo menos um item', async () => {
    const c = await clienteQualquer();
    await expect(criarOrcamento(db, { clienteId: c.id, itens: [] })).rejects.toThrow(
      'pelo menos um item'
    );
  });

  it('numero e sequencial entre orcamentos', async () => {
    const c = await clienteQualquer();
    const primeiro = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });
    const segundo = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    expect(primeiro.orcamento.numero).toBe(1);
    expect(segundo.orcamento.numero).toBe(2);
  });

  it('comeca como aberto', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });
    expect(orcamento.status).toBe('aberto');
  });
});

describe('total congelado ao aprovar', () => {
  it('editar itens funciona enquanto o orcamento esta aberto', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    await atualizarOrcamento(db, orcamento.id, {
      itens: [{ descricao: 'Item mais caro', valorUnitarioCentavos: 2000 }],
    });

    const atualizado = await buscarOrcamento(db, orcamento.id);
    expect(atualizado?.totalCentavos).toBe(2000);
  });

  it('editar itens de um orcamento aprovado e recusado — o total nao pode mudar depois de fechado', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    await aprovarOrcamento(db, orcamento.id);

    await expect(
      atualizarOrcamento(db, orcamento.id, {
        itens: [{ descricao: 'Item mais caro', valorUnitarioCentavos: 99999 }],
      })
    ).rejects.toThrow('so e possivel editar um orcamento em aberto');

    const depois = await buscarOrcamento(db, orcamento.id);
    expect(depois?.totalCentavos).toBe(1000);
  });

  it('reabrir volta o orcamento para aberto e libera edicao de novo', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    await recusarOrcamento(db, orcamento.id);
    await reabrirOrcamento(db, orcamento.id);

    const reaberto = await buscarOrcamento(db, orcamento.id);
    expect(reaberto?.status).toBe('aberto');

    await atualizarOrcamento(db, orcamento.id, {
      itens: [{ descricao: 'Item novo', valorUnitarioCentavos: 3000 }],
    });
    const atualizado = await buscarOrcamento(db, orcamento.id);
    expect(atualizado?.totalCentavos).toBe(3000);
  });
});

describe('duplicarOrcamento', () => {
  it('copia cliente e itens para um novo orcamento aberto, com numero novo', async () => {
    const c = await clienteQualquer();
    const { orcamento: original } = await criarOrcamento(db, {
      clienteId: c.id,
      descontoCentavos: 100,
      observacoes: 'Pago em 2x',
      itens: [
        { descricao: 'Item A', valorUnitarioCentavos: 1000 },
        { descricao: 'Item B', quantidadeMilesimos: 2000, valorUnitarioCentavos: 500 },
      ],
    });

    await aprovarOrcamento(db, original.id);

    const { orcamento: copia, itens } = await duplicarOrcamento(db, original.id);

    expect(copia.id).not.toBe(original.id);
    expect(copia.numero).toBe(2);
    expect(copia.status).toBe('aberto');
    expect(copia.clienteId).toBe(original.clienteId);
    expect(copia.totalCentavos).toBe(original.totalCentavos);
    expect(itens).toHaveLength(2);
  });
});

describe('exclusao logica', () => {
  it('excluir nao apaga a linha, so marca deletadoEm; restaurar desfaz', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    await excluirOrcamento(db, orcamento.id);
    let linha = await buscarOrcamento(db, orcamento.id);
    expect(linha?.deletadoEm).not.toBeNull();

    await restaurarOrcamento(db, orcamento.id);
    linha = await buscarOrcamento(db, orcamento.id);
    expect(linha?.deletadoEm).toBeNull();
  });

  it('itens continuam no banco (cascade so dispara com DELETE de verdade, nao com soft delete)', async () => {
    const c = await clienteQualquer();
    const { orcamento } = await criarOrcamento(db, {
      clienteId: c.id,
      itens: [{ descricao: 'Item', valorUnitarioCentavos: 1000 }],
    });

    await excluirOrcamento(db, orcamento.id);
    const itens = await itensDoOrcamento(db, orcamento.id);
    expect(itens).toHaveLength(1);
  });
});
