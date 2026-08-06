import {
  exportarBackup,
  importarBackup,
  nomeDoArquivoBackup,
  resumirBackup,
  validarBackup,
  type ResumoBackup,
} from '@repo/core/db';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db';

/**
 * Backup no aparelho.
 *
 * Duas camadas com papeis diferentes:
 *
 *   - EXPORTAR e a copia que o comerciante leva para fora — WhatsApp para si
 *     mesmo, Drive, cartao. E a unica que sobrevive a perder o celular.
 *   - AUTOMATICO e uma rede de seguranca local contra erro de operacao: apagar
 *     cliente sem querer, restaurar arquivo errado. Nao protege contra perder o
 *     aparelho, e a tela deixa isso claro.
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
  const backup = await exportarBackup(db);
  const nome = nomeDoArquivoBackup('fiado');

  // Vai para o cache: e um arquivo de passagem, que existe so ate o usuario
  // escolher onde guardar. Sujar o diretorio de documentos com cada exportacao
  // encheria o armazenamento do aparelho com o tempo.
  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Guardar backup da caderneta',
  });

  return true;
}

export type ArquivoEscolhido = {
  resumo: ResumoBackup;
  aplicar: () => Promise<ResumoBackup>;
};

/**
 * Deixa o usuario escolher um arquivo e o valida — mas NAO importa ainda.
 *
 * A separacao e proposital: importar substitui a caderneta inteira, e o usuario
 * precisa ver quantos registros vem no arquivo antes de confirmar. Ler e
 * aplicar no mesmo passo tornaria a confirmacao decorativa.
 */
export async function escolherBackup(): Promise<
  { ok: true; escolhido: ArquivoEscolhido } | { ok: false; erro: string | null }
> {
  // Aceita qualquer tipo de arquivo de proposito. Um backup que voltou pelo
  // WhatsApp ou pelo Drive frequentemente perde o `application/json` e chega
  // como octet-stream — filtrar por MIME esconderia o proprio backup do usuario
  // na lista. Quem garante que o arquivo presta e a validacao do conteudo, logo
  // abaixo, que e bem mais confiavel que a extensao.
  const escolha = await File.pickFileAsync({ mimeTypes: '*/*' });

  // Cancelar nao e erro: devolve erro null para a tela nao mostrar aviso.
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
      resumo: resumirBackup(validacao.backup),
      aplicar: async () => {
        // Antes de substituir, guarda o estado atual. Se o usuario restaurou o
        // arquivo errado, o que ele tinha ainda existe na pasta automatica.
        await gravarCopiaAutomatica(true);
        return importarBackup(db, validacao.backup);
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
    // O nome comeca com a data em formato ordenavel, entao ordenar texto ja
    // devolve cronologia — mais recente primeiro.
    .sort((a, b) => (a.nome < b.nome ? 1 : -1));
}

/**
 * Grava uma copia local, respeitando o intervalo minimo.
 *
 * `forcar` ignora o intervalo — usado antes de restaurar, quando a copia e a
 * unica coisa entre o usuario e a perda do que ele tinha.
 */
export async function gravarCopiaAutomatica(forcar = false): Promise<boolean> {
  const copias = listarCopiasAutomaticas();

  if (!forcar) {
    const ultima = copias[0]?.quando;
    if (ultima != null) {
      const horas = (Date.now() - ultima.getTime()) / 3_600_000;
      if (horas < HORAS_ENTRE_COPIAS) return false;
    }
  }

  const backup = await exportarBackup(db);
  const arquivo = new File(pastaDeBackups(), nomeDoArquivoBackup('fiado'));
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(JSON.stringify(backup));

  limparCopiasAntigas();
  return true;
}

/** Restaura a partir de uma copia local. */
export async function restaurarCopiaLocal(uri: string): Promise<ResumoBackup> {
  const arquivo = new File(uri);
  const conteudo = JSON.parse(arquivo.textSync());

  const validacao = validarBackup(conteudo);
  if (!validacao.ok) throw new Error(validacao.erro);

  return importarBackup(db, validacao.backup);
}

function limparCopiasAntigas(): void {
  const copias = listarCopiasAutomaticas();
  for (const copia of copias.slice(QUANTAS_COPIAS_MANTER)) {
    try {
      new File(copia.uri).delete();
    } catch {
      // Falhar ao apagar copia velha nao pode derrubar o backup novo, que ja
      // foi gravado com sucesso. No pior caso sobra um arquivo a mais.
    }
  }
}

/** Extrai a data do nome `fiado-backup-2026-08-06-0905.json`. */
function dataDoNome(nome: string): Date | null {
  const partes = nome.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
  if (partes == null) return null;

  const [, ano, mes, dia, hora, minuto] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
}
