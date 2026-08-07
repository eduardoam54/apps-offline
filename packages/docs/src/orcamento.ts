import { formatarBRL, formatarDataBR, formatarNumero, formatarQuantidade, totalDoItem, type Centavos } from '@repo/core';

import { gerarCsv } from './csv';
import { escaparHtml, escaparOpcional, paginaHtml } from './html';

/**
 * Orcamento/ordem de servico, em PDF.
 *
 * E o produto inteiro do app orcamento — o que faz o autonomo trocar a
 * mensagem de texto avulsa por um documento com cara de empresa. Por isso
 * qualquer coisa nova aqui merece atencao redobrada de layout.
 */

export type ItemOrcamento = {
  descricao: string;
  quantidadeMilesimos: number;
  valorUnitarioCentavos: Centavos;
};

export type DadosOrcamentoDocumento = {
  empresa: { nome: string; telefone: string | null; documento: string | null };
  cliente: { nome: string; telefone: string | null };
  numero: number;
  /** Dia civil do orcamento. */
  data: string;
  itens: ItemOrcamento[];
  descontoCentavos: Centavos;
  totalCentavos: Centavos;
  observacoes: string | null;
  /** Logo do profissional, ja resolvida em base64 pelo app — ler arquivo e nativo. */
  logoBase64?: string | null;
  /**
   * Marca d'agua discreta do plano gratuito. Fica no documento, nao na tela: e
   * o que da ao usuario um motivo concreto para assinar, sem tirar nenhuma
   * funcao de quem nao paga.
   */
  marcaDagua: boolean;
};

export function htmlOrcamento(dados: DadosOrcamentoDocumento): string {
  const linhas = dados.itens.map((item) => {
    const subtotal = totalDoItem(item.valorUnitarioCentavos, item.quantidadeMilesimos);
    return `<tr>
      <td>${escaparHtml(item.descricao)}</td>
      <td class="numero">${formatarQuantidade(item.quantidadeMilesimos)}</td>
      <td class="numero">${formatarBRL(item.valorUnitarioCentavos)}</td>
      <td class="numero">${formatarBRL(subtotal)}</td>
    </tr>`;
  });

  const logo =
    dados.logoBase64 != null
      ? `<img src="data:image/png;base64,${dados.logoBase64}" style="max-height:56px;margin-bottom:14px;" />`
      : '';

  const marcaDagua = dados.marcaDagua
    ? `<div style="position:fixed;top:42%;left:8%;transform:rotate(-28deg);font-size:52px;color:rgba(17,24,39,0.07);font-weight:700;white-space:nowrap;pointer-events:none;z-index:0;">
        Versão gratuita
      </div>`
    : '';

  const bruto = dados.totalCentavos + dados.descontoCentavos;

  const corpo = `
    ${marcaDagua}
    ${logo}
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="numero">Qtd</th>
          <th class="numero">Valor unit.</th>
          <th class="numero">Subtotal</th>
        </tr>
      </thead>
      <tbody>${linhas.join('')}</tbody>
    </table>
    ${
      dados.descontoCentavos > 0
        ? `<div class="fraco" style="text-align:right;margin-top:10px;">
             Subtotal: ${formatarBRL(bruto)} · Desconto: −${formatarBRL(dados.descontoCentavos)}
           </div>`
        : ''
    }
    <div class="total">
      <span class="total-rotulo">Total</span>
      <span class="total-valor">${formatarBRL(dados.totalCentavos)}</span>
    </div>
    ${
      dados.observacoes != null && dados.observacoes.trim() !== ''
        ? `<div style="margin-top:22px;">
             <div class="fraco" style="text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Observações</div>
             <div>${escaparOpcional(dados.observacoes)}</div>
           </div>`
        : ''
    }
  `;

  const contatoEmpresa = [dados.empresa.telefone, dados.empresa.documento]
    .filter((v): v is string => v != null && v.trim() !== '')
    .join(' · ');

  return paginaHtml({
    titulo: `Orçamento #${dados.numero} — ${dados.cliente.nome}`,
    loja: dados.empresa.nome,
    lojaSemNome: 'Orçamento',
    lojaContato: contatoEmpresa === '' ? null : contatoEmpresa,
    tipo: `Orçamento nº ${dados.numero} · ${formatarDataBR(dados.data)}`,
    assunto: dados.cliente.nome,
    corpo,
    rodape: 'Documento gerado pelo aplicativo, sem valor fiscal.',
  });
}

const NOME_DO_STATUS: Record<string, string> = {
  aberto: 'Em aberto',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

export type OrcamentoCsv = {
  numero: number;
  cliente: string;
  /** Dia civil 'AAAA-MM-DD'. */
  data: string;
  status: 'aberto' | 'aprovado' | 'recusado';
  totalCentavos: Centavos;
};

/** Todo o historico de orcamentos, uma linha cada — recurso do plano pago. */
export function csvOrcamentos(orcamentos: OrcamentoCsv[]): string {
  const emOrdem = [...orcamentos].sort((a, b) => (a.data < b.data ? 1 : -1));

  return gerarCsv(
    ['Número', 'Cliente', 'Data', 'Status', 'Total'],
    emOrdem.map((o) => [
      String(o.numero),
      o.cliente,
      formatarDataBR(o.data),
      NOME_DO_STATUS[o.status] ?? o.status,
      formatarNumero(o.totalCentavos),
    ])
  );
}
