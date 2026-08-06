import {
  consultaClientesComSaldo,
  listarLancamentosParaExportar,
  type ClienteComSaldo,
} from '@repo/core/db';
import { hoje } from '@repo/core';
import {
  csvClientes,
  csvLancamentos,
  htmlExtratoCliente,
  htmlRelatorioDevedores,
  nomeDoArquivo,
  paraNomeDeArquivo,
  type LancamentoExtrato,
} from '@repo/docs';
import { compartilhar, gerarPdf, gerarTexto } from '@repo/docs/arquivo';

import { db } from '@/db';

/**
 * Exportacao de documentos e planilhas.
 *
 * Dois publicos, dois formatos, e a distincao nao e cosmetica:
 *
 *   - PDF vai para o CLIENTE ou para a parede. E documento: layout fixo, abre
 *     igual em qualquer celular, ninguem edita sem querer.
 *   - CSV vai para o COMPUTADOR de quem faz a conta. E dado: serve para somar,
 *     filtrar e cruzar com outra coisa.
 *
 * Todas as funcoes devolvem `false` quando o aparelho nao tem o menu de
 * compartilhar. O arquivo foi gerado e ficou no cache, inalcancavel — a tela
 * precisa avisar, porque um botao que parece nao ter feito nada e pior que um
 * erro na cara.
 */

export type Loja = { nome: string; telefone: string | null };

/**
 * Extrato de um cliente em PDF.
 *
 * Recebe os lancamentos ja carregados pela tela em vez de consultar de novo: a
 * tela de detalhe do cliente ja tem a lista inteira em memoria por consulta ao
 * vivo, e reconsultar abriria a porta para o PDF sair diferente do que esta na
 * tela naquele instante.
 */
export async function exportarExtratoDoCliente(
  cliente: { nome: string; telefone: string | null },
  lancamentos: LancamentoExtrato[],
  loja: Loja
): Promise<boolean> {
  const html = htmlExtratoCliente({
    loja,
    cliente,
    lancamentos,
    geradoEm: hoje(),
  });

  const apelido = paraNomeDeArquivo(cliente.nome);
  const uri = await gerarPdf(
    html,
    nomeDoArquivo(apelido === '' ? 'extrato' : `extrato-${apelido}`, 'pdf')
  );

  return compartilhar(uri, 'pdf', `Extrato de ${cliente.nome}`);
}

/** Relatorio de quem esta devendo, em PDF. */
export async function exportarRelatorioDeDevedores(loja: Loja): Promise<boolean> {
  const clientes = (await consultaClientesComSaldo(db)) as ClienteComSaldo[];

  const html = htmlRelatorioDevedores({
    loja,
    clientes: clientes.map((c) => ({
      nome: c.nome,
      telefone: c.telefone,
      saldoCentavos: c.saldoCentavos,
      ultimaCompra: c.ultimaCompra,
    })),
    geradoEm: hoje(),
  });

  const uri = await gerarPdf(html, nomeDoArquivo('fiado-devedores', 'pdf'));
  return compartilhar(uri, 'pdf', 'Relatório de quem está devendo');
}

/** Todos os lancamentos da caderneta, em planilha. */
export async function exportarLancamentosEmCsv(): Promise<boolean> {
  const lancamentos = await listarLancamentosParaExportar(db);

  const uri = gerarTexto(
    csvLancamentos(lancamentos),
    nomeDoArquivo('fiado-lancamentos', 'csv')
  );

  return compartilhar(uri, 'csv', 'Planilha de lançamentos');
}

/** A lista de clientes com o saldo de cada um, em planilha. */
export async function exportarClientesEmCsv(): Promise<boolean> {
  const clientes = (await consultaClientesComSaldo(db)) as ClienteComSaldo[];

  const uri = gerarTexto(
    csvClientes(
      clientes.map((c) => ({
        nome: c.nome,
        telefone: c.telefone,
        saldoCentavos: c.saldoCentavos,
        ultimaCompra: c.ultimaCompra,
        ultimoPagamento: c.ultimoPagamento,
      }))
    ),
    nomeDoArquivo('fiado-clientes', 'csv')
  );

  return compartilhar(uri, 'csv', 'Planilha de clientes');
}
