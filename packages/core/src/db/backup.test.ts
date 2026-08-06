import { beforeEach, describe, expect, it } from 'vitest';

import {
  exportarBackup,
  importarBackup,
  nomeDoArquivoBackup,
  resumirBackup,
  validarBackup,
  VERSAO_BACKUP,
} from './backup';
import { consultaClientesComSaldo, saldoDoCliente, totalAReceber } from './consultas';
import { criarAcordo } from './repos/acordo';
import { criarCliente } from './repos/cliente';
import { CHAVES, gravarConfig, lerConfig } from './repos/config';
import { receberPagamento } from './repos/pagamento';
import { lancarVenda } from './repos/venda';
import { bancoDeTeste } from './teste-helpers';
import type { BancoSQLite } from './tipos';
import type { ClienteComSaldo } from './consultas';

let db: BancoSQLite;

beforeEach(() => {
  db = bancoDeTeste();
});

/** Monta uma caderneta com um pouco de tudo. */
async function cadernetaCompleta() {
  const joao = await criarCliente(db, { nome: 'João da Silva', telefone: '11987654321' });
  const maria = await criarCliente(db, { nome: 'Maria', limiteCreditoCentavos: 5000 });

  await lancarVenda(db, { clienteId: joao.id, valorCentavos: 4200, data: '2026-08-01' });
  await lancarVenda(db, {
    clienteId: joao.id,
    data: '2026-08-03',
    itens: [
      { descricao: 'Pão francês', quantidadeMilesimos: 6000, valorUnitarioCentavos: 100 },
      { descricao: 'Leite', valorUnitarioCentavos: 550 },
    ],
  });
  await lancarVenda(db, { clienteId: maria.id, valorCentavos: 8000, data: '2026-08-02' });
  await receberPagamento(db, { clienteId: joao.id, valorCentavos: 2000, data: '2026-08-04' });

  await criarAcordo(db, {
    clienteId: maria.id,
    valorTotalCentavos: 8000,
    numParcelas: 2,
    primeiroVencimento: '2026-09-01',
  });

  await gravarConfig(db, CHAVES.nomeDaLoja, 'Mercadinho do Zé');

  return { joao, maria };
}

describe('exportar', () => {
  it('leva todas as tabelas', async () => {
    await cadernetaCompleta();
    const backup = await exportarBackup(db);

    expect(backup.versao).toBe(VERSAO_BACKUP);
    expect(backup.app).toBe('fiado');
    expect(Object.keys(backup.tabelas).sort()).toEqual([
      'acordo',
      'acordo_parcela',
      'cliente',
      'config',
      'pagamento',
      'produto_frequente',
      'venda',
      'venda_item',
    ]);
  });

  it('funciona com caderneta vazia', async () => {
    const backup = await exportarBackup(db);
    expect(resumirBackup(backup)).toEqual({ clientes: 0, lancamentos: 0, pagamentos: 0 });
  });

  it('resume o conteudo para o usuario conferir', async () => {
    await cadernetaCompleta();
    expect(resumirBackup(await exportarBackup(db))).toEqual({
      clientes: 2,
      lancamentos: 3,
      pagamentos: 1,
    });
  });
});

describe('ida e volta', () => {
  it('restaura a caderneta identica num banco vazio', async () => {
    // Esta e a garantia que sustenta a promessa de nao perder a caderneta.
    const { joao, maria } = await cadernetaCompleta();

    const saldoJoaoAntes = await saldoDoCliente(db, joao.id);
    const saldoMariaAntes = await saldoDoCliente(db, maria.id);
    const totalAntes = await totalAReceber(db);
    const backup = await exportarBackup(db);

    // Aparelho novo: outro banco, do zero.
    const outro = bancoDeTeste();
    await importarBackup(outro, backup);

    expect(await saldoDoCliente(outro, joao.id)).toBe(saldoJoaoAntes);
    expect(await saldoDoCliente(outro, maria.id)).toBe(saldoMariaAntes);
    expect(await totalAReceber(outro)).toBe(totalAntes);
    expect(await lerConfig(outro, CHAVES.nomeDaLoja)).toBe('Mercadinho do Zé');
  });

  it('preserva os itens da venda', async () => {
    const { joao } = await cadernetaCompleta();
    const backup = await exportarBackup(db);

    const outro = bancoDeTeste();
    await importarBackup(outro, backup);

    expect(backup.tabelas.venda_item).toHaveLength(2);
    expect(await saldoDoCliente(outro, joao.id)).toBe(await saldoDoCliente(db, joao.id));
  });

  it('preserva o acordo e as parcelas', async () => {
    await cadernetaCompleta();
    const backup = await exportarBackup(db);

    const outro = bancoDeTeste();
    await importarBackup(outro, backup);

    expect(backup.tabelas.acordo).toHaveLength(1);
    expect(backup.tabelas.acordo_parcela).toHaveLength(2);
    // E o mais importante: restaurar o acordo nao pode inflar o saldo.
    expect(await totalAReceber(outro)).toBe(await totalAReceber(db));
  });

  it('substitui o conteudo existente em vez de somar', async () => {
    // Restaurar por cima de uma caderneta com dados nao pode duplicar nada.
    await cadernetaCompleta();
    const backup = await exportarBackup(db);
    const totalOriginal = await totalAReceber(db);

    await importarBackup(db, backup);

    expect(await totalAReceber(db)).toBe(totalOriginal);
    expect((await consultaClientesComSaldo(db)) as ClienteComSaldo[]).toHaveLength(2);
  });

  it('restaurar backup vazio limpa a caderneta', async () => {
    const vazio = await exportarBackup(bancoDeTeste());
    await cadernetaCompleta();

    await importarBackup(db, vazio);

    expect(await totalAReceber(db)).toBe(0);
    expect(await consultaClientesComSaldo(db)).toHaveLength(0);
  });
});

describe('validar', () => {
  it('aceita backup de verdade', async () => {
    const backup = await exportarBackup(db);
    const resultado = validarBackup(JSON.parse(JSON.stringify(backup)));
    expect(resultado.ok).toBe(true);
  });

  it('recusa arquivo que nao e backup', () => {
    // Importar substitui tudo. Deixar um arquivo qualquer chegar ate a
    // substituicao apagaria a caderneta por um toque errado no seletor.
    expect(validarBackup(null).ok).toBe(false);
    expect(validarBackup('texto').ok).toBe(false);
    expect(validarBackup({}).ok).toBe(false);
    expect(validarBackup({ versao: 1 }).ok).toBe(false);
    expect(validarBackup({ versao: 1, tabelas: {} }).ok).toBe(false);
  });

  it('recusa backup de versao mais nova', () => {
    const resultado = validarBackup({
      versao: VERSAO_BACKUP + 1,
      tabelas: { cliente: [] },
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain('mais nova');
  });
});

describe('nome do arquivo', () => {
  it('e ordenavel e legivel', () => {
    const nome = nomeDoArquivoBackup('fiado', new Date(2026, 7, 6, 9, 5));
    expect(nome).toBe('fiado-backup-2026-08-06-0905.json');
  });
});
