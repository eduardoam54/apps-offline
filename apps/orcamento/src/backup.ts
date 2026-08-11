import {
  exportarBackupOrcamento,
  importarBackupOrcamento,
  nomeDoArquivoBackup,
  resumirBackupOrcamento,
  validarBackup,
  type ResumoBackupOrcamento,
} from '@repo/core/db';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db';

/**
 * Backup do app orcamento.
 *
 * Mesma arquitetura do fiado (ver apps/fiado/src/backup.ts): duas camadas,
 * exportar para fora e copias automaticas locais. A unica diferenca e que
 * as tabelas envolvidas sao cliente, config, orcamento e orcamento_item.
 */

const PASTA_AUTOMATICO = 'backups';
const QUANTAS_COPIAS_MANTER = 5;
const HORAS_ENTRE_COPIAS = 24;

function pastaDeBackups(): Directory {
  const pasta = new Directory(Paths.document, PASTA_AUTOMATICO);
  if (!pasta.exists) pasta.create({ intermediates: true });
  return pasta;
}

/** Gera o arquivo e abre o menu de compartilhamento do sistema. */
export async function exportarECompartilhar(): Promise<boolean> {
  const backup = await exportarBackupOrcamento(db);
  const nome = nomeDoArquivoBackup('orcamento');

  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Guardar backup dos orçamentos',
  });

  return true;
}

export type ArquivoEscolhido = {
  resumo: ResumoBackupOrcamento;
  aplicar: () => Promise<ResumoBackupOrcamento>;
};

/**
 * Deixa o usuario escolher um arquivo e o valida — mas NAO importa ainda.
 *
 * Ver motivo em apps/fiado/src/backup.ts.
 */
export async function escolherBackup(): Promise<
  { ok: true; escolhido: ArquivoEscolhido } | { ok: false; erro: string | null }
> {
  const escolha = await File.pickFileAsync({ mimeTypes: '*/*' });
  if (escolha.canceled) return { ok: false, erro: null };

  let conteudo: unknown;
  try {
    conteudo = JSON.parse(await escolha.result.text());
  } catch {
    return { ok: false, erro: 'Não deu para ler o arquivo. Ele pode estar corrompido.' };
  }

  const validacao = validarBackup(conteudo);
  if (!validacao.ok) return { ok: false, erro: validacao.erro };

  return {
    ok: true,
    escolhido: {
      resumo: resumirBackupOrcamento(validacao.backup),
      aplicar: async () => {
        await gravarCopiaAutomatica(true);
        return importarBackupOrcamento(db, validacao.backup);
      },
    },
  };
}

export type CopiaLocal = {
  nome: string;
  uri: string;
  quando: Date | null;
};

export function listarCopiasAutomaticas(): CopiaLocal[] {
  const itens = pastaDeBackups().list();
  return itens
    .filter((item): item is File => item instanceof File && item.name.endsWith('.json'))
    .map((arquivo) => ({
      nome: arquivo.name,
      uri: arquivo.uri,
      quando: dataDoNome(arquivo.name),
    }))
    .sort((a, b) => (a.nome < b.nome ? 1 : -1));
}

export async function gravarCopiaAutomatica(forcar = false): Promise<boolean> {
  const copias = listarCopiasAutomaticas();

  if (!forcar) {
    const ultima = copias[0]?.quando;
    if (ultima != null) {
      const horas = (Date.now() - ultima.getTime()) / 3_600_000;
      if (horas < HORAS_ENTRE_COPIAS) return false;
    }
  }

  const backup = await exportarBackupOrcamento(db);
  const arquivo = new File(pastaDeBackups(), nomeDoArquivoBackup('orcamento'));
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  limparCopiasAntigas();
  return true;
}

export async function restaurarCopiaLocal(uri: string): Promise<ResumoBackupOrcamento> {
  const arquivo = new File(uri);
  const conteudo = JSON.parse(arquivo.textSync());

  const validacao = validarBackup(conteudo);
  if (!validacao.ok) throw new Error(validacao.erro);

  return importarBackupOrcamento(db, validacao.backup);
}

function limparCopiasAntigas(): void {
  const copias = listarCopiasAutomaticas();
  for (const copia of copias.slice(QUANTAS_COPIAS_MANTER)) {
    try {
      new File(copia.uri).delete();
    } catch {
      // Falha ao apagar copia velha nao derruba o backup novo.
    }
  }
}

/** Extrai a data do nome `orcamento-backup-2026-08-11-1430.json`. */
function dataDoNome(nome: string): Date | null {
  const partes = nome.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
  if (partes == null) return null;
  const [, ano, mes, dia, hora, minuto] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
}
