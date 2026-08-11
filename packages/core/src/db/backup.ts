import { agora } from '../date';
import {
  abastecimento,
  acordo,
  acordoParcela,
  cliente,
  config,
  lembrete,
  manutencao,
  orcamento,
  orcamentoItem,
  pagamento,
  produtoFrequente,
  veiculo,
  venda,
  vendaItem,
} from './schema';
import type { BancoSQLite } from './tipos';

/**
 * Backup e restauracao.
 *
 * Este arquivo e o que faz o comerciante largar o caderno de papel. Ele so migra
 * quando acredita que nao vai perder a caderneta — e sem exportacao confiavel
 * essa confianca nao existe.
 *
 * O backup e um arquivo JSON que o proprio usuario guarda onde quiser: WhatsApp
 * para si mesmo, Google Drive, cartao de memoria. Nao ha nuvem nossa envolvida,
 * o que mantem o custo de operacao em zero e o dado sob controle de quem o
 * gerou.
 */

export const VERSAO_BACKUP = 1;

/**
 * Ordem de insercao respeitando as chaves estrangeiras: pai antes de filho.
 * Restaurar fora desta ordem falharia com violacao de FK.
 */
const TABELAS = [
  { nome: 'cliente', tabela: cliente },
  { nome: 'venda', tabela: venda },
  { nome: 'venda_item', tabela: vendaItem },
  { nome: 'pagamento', tabela: pagamento },
  { nome: 'acordo', tabela: acordo },
  { nome: 'acordo_parcela', tabela: acordoParcela },
  { nome: 'produto_frequente', tabela: produtoFrequente },
  { nome: 'config', tabela: config },
] as const;

export type Backup = {
  versao: number;
  app: string;
  geradoEm: string;
  tabelas: Record<string, Record<string, unknown>[]>;
};

export type ResumoBackup = {
  clientes: number;
  lancamentos: number;
  pagamentos: number;
};

export async function exportarBackup(db: BancoSQLite, app = 'fiado'): Promise<Backup> {
  const tabelas: Record<string, Record<string, unknown>[]> = {};

  for (const { nome, tabela } of TABELAS) {
    tabelas[nome] = (await db.select().from(tabela)) as Record<string, unknown>[];
  }

  return { versao: VERSAO_BACKUP, app, geradoEm: agora(), tabelas };
}

/**
 * Verifica se o arquivo escolhido e mesmo um backup deste app.
 *
 * Importar substitui TUDO. Deixar um arquivo qualquer chegar ate a substituicao
 * significaria apagar a caderneta inteira por causa de um toque errado no
 * seletor de arquivos.
 */
export function validarBackup(dados: unknown): { ok: true; backup: Backup } | { ok: false; erro: string } {
  if (typeof dados !== 'object' || dados == null) {
    return { ok: false, erro: 'O arquivo não parece um backup.' };
  }

  const candidato = dados as Partial<Backup>;

  if (typeof candidato.versao !== 'number') {
    return { ok: false, erro: 'O arquivo não parece um backup.' };
  }
  if (candidato.versao > VERSAO_BACKUP) {
    return {
      ok: false,
      erro: 'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.',
    };
  }
  if (typeof candidato.tabelas !== 'object' || candidato.tabelas == null) {
    return { ok: false, erro: 'O arquivo está incompleto.' };
  }
  if (!Array.isArray(candidato.tabelas.cliente)) {
    return { ok: false, erro: 'O arquivo está incompleto.' };
  }

  return { ok: true, backup: candidato as Backup };
}

/** Quantos registros o backup traz, para o usuario conferir antes de substituir. */
export function resumirBackup(backup: Backup): ResumoBackup {
  return {
    clientes: backup.tabelas.cliente?.length ?? 0,
    lancamentos: backup.tabelas.venda?.length ?? 0,
    pagamentos: backup.tabelas.pagamento?.length ?? 0,
  };
}

/**
 * Restaura o backup SUBSTITUINDO o conteudo atual.
 *
 * Substituicao e nao mesclagem de proposito. Mesclar exigiria decidir o que
 * fazer com registros de mesmo id e valor diferente, e qualquer escolha
 * automatica ali pode silenciosamente somar divida que nao existe ou apagar
 * pagamento que existiu. Restaurar significa "volte a caderneta para este
 * estado" — e a tela deixa isso explicito antes de confirmar.
 *
 * As tabelas sao apagadas na ordem inversa da insercao para nao violar chave
 * estrangeira.
 */
export async function importarBackup(db: BancoSQLite, backup: Backup): Promise<ResumoBackup> {
  for (const { tabela } of [...TABELAS].reverse()) {
    await db.delete(tabela);
  }

  for (const { nome, tabela } of TABELAS) {
    const linhas = backup.tabelas[nome];
    if (linhas == null || linhas.length === 0) continue;

    // Em lotes: SQLite tem teto de variaveis por comando, e uma caderneta
    // grande passaria dele num insert unico.
    for (let i = 0; i < linhas.length; i += 100) {
      await db.insert(tabela).values(linhas.slice(i, i + 100) as never);
    }
  }

  return resumirBackup(backup);
}

/** Nome sugerido do arquivo: ordenavel e legivel na lista de downloads. */
export function nomeDoArquivoBackup(app = 'fiado', quando = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const data = `${quando.getFullYear()}-${p(quando.getMonth() + 1)}-${p(quando.getDate())}`;
  const hora = `${p(quando.getHours())}${p(quando.getMinutes())}`;
  return `${app}-backup-${data}-${hora}.json`;
}

// ---------------------------------------------------------------------------
// Backup do app orcamento
// ---------------------------------------------------------------------------

/**
 * Tabelas do orcamento, na ordem de insercao (pai antes de filho).
 *
 * `config` inclui os dados da empresa (logo, nome, telefone, documento) e o
 * PIN — tudo que o usuario configurou. Deixar de fora tornaria o backup
 * incompleto e forcaria reconfigurar tudo apos restaurar.
 */
const TABELAS_ORCAMENTO = [
  { nome: 'cliente', tabela: cliente },
  { nome: 'config', tabela: config },
  { nome: 'orcamento', tabela: orcamento },
  { nome: 'orcamento_item', tabela: orcamentoItem },
] as const;

export type ResumoBackupOrcamento = {
  clientes: number;
  orcamentos: number;
};

export async function exportarBackupOrcamento(db: BancoSQLite): Promise<Backup> {
  const tabelas: Record<string, Record<string, unknown>[]> = {};
  for (const { nome, tabela } of TABELAS_ORCAMENTO) {
    tabelas[nome] = (await db.select().from(tabela)) as Record<string, unknown>[];
  }
  return { versao: VERSAO_BACKUP, app: 'orcamento', geradoEm: agora(), tabelas };
}

/** Resumo do que vem no backup — mostrado ao usuario antes de confirmar restauracao. */
export function resumirBackupOrcamento(backup: Backup): ResumoBackupOrcamento {
  return {
    clientes: backup.tabelas.cliente?.length ?? 0,
    orcamentos: backup.tabelas.orcamento?.length ?? 0,
  };
}

export async function importarBackupOrcamento(
  db: BancoSQLite,
  backup: Backup
): Promise<ResumoBackupOrcamento> {
  // Apaga na ordem inversa para nao violar chave estrangeira.
  for (const { tabela } of [...TABELAS_ORCAMENTO].reverse()) {
    await db.delete(tabela);
  }

  for (const { nome, tabela } of TABELAS_ORCAMENTO) {
    const linhas = backup.tabelas[nome];
    if (linhas == null || linhas.length === 0) continue;

    for (let i = 0; i < linhas.length; i += 100) {
      await db.insert(tabela).values(linhas.slice(i, i + 100) as never);
    }
  }

  return resumirBackupOrcamento(backup);
}

// ---------------------------------------------------------------------------
// Backup do app veiculo
// ---------------------------------------------------------------------------

/**
 * Tabelas do veiculo, na ordem de insercao (pai antes de filho).
 *
 * `config` guarda o PIN e configuracoes globais do app (ex: unidade de
 * combustivel) e entra junto para que o usuario nao precise reconfigurar
 * tudo apos restaurar.
 */
const TABELAS_VEICULO = [
  { nome: 'veiculo', tabela: veiculo },
  { nome: 'abastecimento', tabela: abastecimento },
  { nome: 'manutencao', tabela: manutencao },
  { nome: 'lembrete', tabela: lembrete },
  { nome: 'config', tabela: config },
] as const;

export type ResumoBackupVeiculo = {
  veiculos: number;
  abastecimentos: number;
  manutencoes: number;
};

export async function exportarBackupVeiculo(db: BancoSQLite): Promise<Backup> {
  const tabelas: Record<string, Record<string, unknown>[]> = {};
  for (const { nome, tabela } of TABELAS_VEICULO) {
    tabelas[nome] = (await db.select().from(tabela)) as Record<string, unknown>[];
  }
  return { versao: VERSAO_BACKUP, app: 'veiculo', geradoEm: agora(), tabelas };
}

export function resumirBackupVeiculo(backup: Backup): ResumoBackupVeiculo {
  return {
    veiculos: backup.tabelas.veiculo?.length ?? 0,
    abastecimentos: backup.tabelas.abastecimento?.length ?? 0,
    manutencoes: backup.tabelas.manutencao?.length ?? 0,
  };
}

export async function importarBackupVeiculo(
  db: BancoSQLite,
  backup: Backup
): Promise<ResumoBackupVeiculo> {
  for (const { tabela } of [...TABELAS_VEICULO].reverse()) {
    await db.delete(tabela);
  }

  for (const { nome, tabela } of TABELAS_VEICULO) {
    const linhas = backup.tabelas[nome];
    if (linhas == null || linhas.length === 0) continue;

    for (let i = 0; i < linhas.length; i += 100) {
      await db.insert(tabela).values(linhas.slice(i, i + 100) as never);
    }
  }

  return resumirBackupVeiculo(backup);
}
