import {
  csvOrcamentos,
  htmlOrcamento,
  nomeDoArquivo,
  paraNomeDeArquivo,
  type ItemOrcamento,
  type OrcamentoCsv,
} from '@repo/docs';
import { compartilhar, gerarPdf, gerarTexto } from '@repo/docs/arquivo';

/**
 * Gera o PDF do orcamento e abre o menu de compartilhar (WhatsApp incluso, via
 * o proprio menu do sistema — nao existe API de WhatsApp aqui, so o `Share`
 * nativo do aparelho).
 *
 * `empresa`, `logoBase64` e `marcaDagua` ainda chegam com valor padrao: as
 * Fases 5 (dados da empresa) e 6 (plano) e que vao preencher isso de verdade,
 * lendo `config` e a licenca. Ate la o PDF sai funcional, so sem esses dois
 * acabamentos.
 */
export type Empresa = { nome: string; telefone: string | null; documento: string | null };

export async function exportarOrcamentoEmPdf(dados: {
  empresa: Empresa;
  cliente: { nome: string; telefone: string | null };
  numero: number;
  data: string;
  itens: ItemOrcamento[];
  descontoCentavos: number;
  totalCentavos: number;
  observacoes: string | null;
  logoBase64?: string | null;
  marcaDagua?: boolean;
}): Promise<boolean> {
  const html = htmlOrcamento({
    ...dados,
    marcaDagua: dados.marcaDagua ?? false,
  });

  const apelido = paraNomeDeArquivo(dados.cliente.nome);
  const uri = await gerarPdf(
    html,
    nomeDoArquivo(apelido === '' ? `orcamento-${dados.numero}` : `orcamento-${dados.numero}-${apelido}`, 'pdf')
  );

  return compartilhar(uri, 'pdf', `Orçamento #${dados.numero} — ${dados.cliente.nome}`);
}

/** Todo o historico de orcamentos, em planilha — recurso do plano pago. */
export async function exportarOrcamentosEmCsv(orcamentos: OrcamentoCsv[]): Promise<boolean> {
  const uri = gerarTexto(csvOrcamentos(orcamentos), nomeDoArquivo('orcamentos', 'csv'));
  return compartilhar(uri, 'csv', 'Planilha de orçamentos');
}
