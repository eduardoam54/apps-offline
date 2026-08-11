import {
  exportarBackupVeiculo,
  importarBackupVeiculo,
  nomeDoArquivoBackup,
  resumirBackupVeiculo,
  validarBackup,
  type ResumoBackupVeiculo,
} from '@repo/core/db';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db';

/**
 * Backup do app veiculo.
 *
 * Mesmo padrao do fiado e orcamento: duas camadas com papeis distintos.
 *   - EXPORTAR: arquivo que o usuario guarda fora do celular.
 *   - AUTOMATICO: rede de seguranca local contra erro de operacao.
 *
 * DIFERENCA: no veiculo o backup e um RECURSO PAGO. O historico de abastecimentos
 * e manutencoes e pessoal e nao financeiro — perder e inconveniente, nao critico.
 * Isso torna o plano pago tangivel mesmo para quem tem so um veiculo.
 *
 * O gate fica na tela (src/app/backup.tsx), e nao aqui, para que os dados
 * possam sempre ser exportados internamente por outros caminhos se necessario.
 */

const PASTA_AUTOMATICO = 'backups';
const QUANTAS_COPIAS_MANTER = 5;
const HORAS_ENTRE_COPIAS = 24;

function pastaDeBackups(): Directory {
  const pasta = new Directory(Paths.document, PASTA_AUTOMATICO);
  if (!pasta.exists) pasta.create({ intermediates: true });
  return pasta;
}

export async function exportarECompartilhar(): Promise<boolean> {
  const backup = await exportarBackupVeiculo(db);
  const nome = nomeDoArquivoBackup('veiculo');

  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Guardar backup do histórico do veículo',
  });

  return true;
}

export type ArquivoEscolhido = {
  resumo: ResumoBackupVeiculo;
  aplicar: () => Promise<ResumoBackupVeiculo>;
};

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
      resumo: resumirBackupVeiculo(validacao.backup),
      aplicar: async () => {
        await gravarCopiaAutomatica(true);
        return importarBackupVeiculo(db, validacao.backup);
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

  const backup = await exportarBackupVeiculo(db);
  const arquivo = new File(pastaDeBackups(), nomeDoArquivoBackup('veiculo'));
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  limparCopiasAntigas();
  return true;
}

export async function restaurarCopiaLocal(uri: string): Promise<ResumoBackupVeiculo> {
  const arquivo = new File(uri);
  const conteudo = JSON.parse(arquivo.textSync());

  const validacao = validarBackup(conteudo);
  if (!validacao.ok) throw new Error(validacao.erro);

  return importarBackupVeiculo(db, validacao.backup);
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

/** Extrai a data do nome `veiculo-backup-2026-08-11-1430.json`. */
function dataDoNome(nome: string): Date | null {
  const partes = nome.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
  if (partes == null) return null;
  const [, ano, mes, dia, hora, minuto] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
}
