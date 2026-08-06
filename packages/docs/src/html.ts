/**
 * Base dos documentos em HTML que viram PDF.
 *
 * O PDF e renderizado pelo `expo-print`, que joga este HTML num WebView do
 * proprio aparelho e imprime o resultado. Isso impoe duas restricoes que valem
 * para todo template daqui:
 *
 *   - NENHUM recurso externo. Sem fonte do Google, sem CSS de CDN, sem imagem
 *     por URL. O app e offline; um `<link>` nao carregaria e o documento sairia
 *     torto justamente no cliente que esta sem internet.
 *   - CSS embutido e simples. O motor e o WebView do sistema, cuja versao varia
 *     conforme o aparelho. Grid e flex modernos funcionam na maioria, mas tabela
 *     com borda continua sendo o que imprime igual em todo lugar.
 *
 * O documento e feito para ser lido no celular, dentro do WhatsApp — nao numa
 * folha A4 em cima da mesa. Por isso a fonte e grande e a densidade e baixa.
 */

/**
 * Escapa texto para entrar em HTML.
 *
 * Nao e teatro de seguranca: o nome do cliente e a descricao da venda sao
 * digitados a mao, e "Bar do Zé & Cia" ou "camisa < R$ 20" quebrariam o
 * documento inteiro se entrassem crus. O `&` precisa ser o primeiro da lista,
 * senao ele reescreveria as entidades geradas pelas substituicoes seguintes.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Igual a escaparHtml, mas aceita ausencia de valor e devolve string vazia. */
export function escaparOpcional(texto: string | null | undefined): string {
  return texto == null ? '' : escaparHtml(texto);
}

const CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px 24px 40px;
    font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.45;
    color: #111827;
    -webkit-text-size-adjust: 100%;
  }
  .cabecalho { border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 22px; }
  .loja { font-size: 21px; font-weight: 700; }
  .loja-contato { font-size: 13px; color: #6B7280; margin-top: 2px; }
  .documento { font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
  .assunto { font-size: 18px; font-weight: 600; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6B7280;
    font-weight: 600;
    padding: 0 0 6px;
    border-bottom: 1px solid #D1D5DB;
  }
  td { padding: 9px 0; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  /* Impedir que uma linha de lancamento seja partida entre duas paginas: meia
     linha de extrato e exatamente o tipo de detalhe que faz o cliente duvidar
     do documento. */
  tr { page-break-inside: avoid; }
  .numero { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .divida { color: #B91C1C; }
  .pago { color: #15803D; }
  .fraco { color: #6B7280; font-size: 13px; }
  .total {
    margin-top: 22px;
    padding: 16px 18px;
    background: #F3F4F6;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .total-rotulo { font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: #4B5563; font-weight: 600; }
  .total-valor { font-size: 26px; font-weight: 700; }
  .rodape { margin-top: 30px; font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.6; }
`;

export type Pagina = {
  titulo: string;
  /** Nome da loja no topo. Vazio quando o comerciante nao preencheu ajustes. */
  loja: string;
  lojaContato?: string | null;
  /** Rotulo do tipo de documento: "Extrato do cliente", "Clientes devendo". */
  tipo: string;
  assunto: string;
  corpo: string;
  rodape: string;
};

export function paginaHtml(p: Pagina): string {
  const loja = p.loja.trim() === '' ? 'Caderneta' : p.loja;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escaparHtml(p.titulo)}</title>
<style>${CSS}</style>
</head>
<body>
  <div class="cabecalho">
    <div class="loja">${escaparHtml(loja)}</div>
    ${p.lojaContato ? `<div class="loja-contato">${escaparHtml(p.lojaContato)}</div>` : ''}
  </div>
  <div class="documento">${escaparHtml(p.tipo)}</div>
  <div class="assunto">${escaparHtml(p.assunto)}</div>
  ${p.corpo}
  <div class="rodape">${escaparHtml(p.rodape)}</div>
</body>
</html>`;
}
