import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * O lado nativo da exportacao: transformar HTML em PDF e entregar o arquivo.
 *
 * Vive num subcaminho (`@repo/docs/arquivo`) pelo mesmo motivo que o banco vive
 * em `@repo/core/db`: aqui dentro ha modulo nativo, e a entrada principal de
 * `@repo/docs` precisa continuar carregavel pelo vitest no Node puro. Quem
 * monta o documento e testado; quem grava o arquivo depende do aparelho.
 */

/**
 * Todo arquivo exportado vai para o cache, nunca para o diretorio de documentos.
 *
 * E um arquivo de passagem: existe so ate o usuario escolher onde guardar no
 * menu de compartilhamento. Gravar cada exportacao em documentos encheria o
 * armazenamento do aparelho com PDFs que ninguem vai abrir de novo. O backup
 * automatico e a excecao, e por isso ele mora em outro lugar.
 */
function noCache(nome: string): File {
  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  return arquivo;
}

/**
 * Renderiza o HTML em PDF e devolve o URI do arquivo.
 *
 * O `printToFileAsync` grava com um nome aleatorio do tipo `a1b2c3d4.pdf`. Esse
 * nome e o que o cliente ve chegar no WhatsApp, entao renomear nao e capricho:
 * "extrato-joao-2026-08-06.pdf" e um documento, "a1b2c3d4.pdf" e um anexo
 * suspeito que ninguem abre.
 */
export async function gerarPdf(html: string, nome: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });

  const origem = new File(uri);
  const destino = noCache(nome);
  origem.moveSync(destino);

  return destino.uri;
}

/** Grava um arquivo de texto (CSV) no cache e devolve o URI. */
export function gerarTexto(conteudo: string, nome: string): string {
  const arquivo = noCache(nome);
  arquivo.create();
  arquivo.write(conteudo);
  return arquivo.uri;
}

export type TipoArquivo = 'pdf' | 'csv';

const MIME: Record<TipoArquivo, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
};

/** UTI do iOS. No Android e ignorado, mas sem ele o iOS trata tudo como binario. */
const UTI: Record<TipoArquivo, string> = {
  pdf: 'com.adobe.pdf',
  csv: 'public.comma-separated-values-text',
};

/**
 * Abre o menu de compartilhamento do sistema.
 *
 * Devolve `false` quando o aparelho nao oferece o menu — a tela precisa avisar,
 * porque nesse caso o arquivo foi gerado e ficou inacessivel, e um botao que
 * aparenta nao ter feito nada e pior do que um erro explicito.
 */
export async function compartilhar(
  uri: string,
  tipo: TipoArquivo,
  titulo: string
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;

  await Sharing.shareAsync(uri, {
    mimeType: MIME[tipo],
    UTI: UTI[tipo],
    dialogTitle: titulo,
  });

  return true;
}
