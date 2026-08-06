import { formatarDataBR, formatarNumero, type Centavos } from '@repo/core';

/**
 * Exportacao em CSV.
 *
 * O destino real deste arquivo e o Excel em portugues, no computador do
 * contador ou do filho do comerciante. Tres detalhes decidem se ele abre certo
 * ou vira uma coluna unica de lixo — e nenhum dos tres da erro, todos apenas
 * produzem um arquivo feio que o usuario culpa o app por gerar:
 *
 *   1. SEPARADOR E PONTO E VIRGULA. O Excel usa o separador de lista do idioma
 *      do sistema, e em pt-BR ele e `;`. Com virgula, a planilha inteira cai
 *      numa coluna so.
 *   2. VALOR COM VIRGULA DECIMAL. "12,50" e reconhecido como numero em pt-BR;
 *      "12.50" vira texto e nao soma. Como o separador ja e `;`, a virgula
 *      decimal nao gera ambiguidade.
 *   3. BOM NO INICIO. Sem ele o Excel le o arquivo como ANSI e "Pão" vira
 *      "PÃ£o". O Google Sheets e o LibreOffice acertam sem o BOM, mas ignoram
 *      sua presenca — entao incluir e o que agrada os tres.
 */

export const SEPARADOR = ';';

/**
 * Marca de ordem de bytes. Escrita como escape de proposito: o caractere real e
 * invisivel no editor e seria apagado por acidente na primeira revisao.
 */
export const BOM = '\uFEFF';

/**
 * Prepara um campo para o CSV.
 *
 * Aspas so entram quando fazem falta — arquivo com aspas em tudo funciona, mas
 * fica ilegivel para quem abrir no bloco de notas para conferir.
 */
export function celula(valor: string | null | undefined): string {
  if (valor == null) return '';

  const texto = String(valor);
  if (!/[;"\r\n]/.test(texto)) return texto;

  // Aspa dentro do campo se escapa duplicando, nao com barra invertida.
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Monta o CSV completo, ja com BOM.
 *
 * Fim de linha CRLF: e o que o RFC 4180 manda e o que o Excel antigo espera.
 * LF sozinho funciona nas versoes atuais, mas nao ha ganho em arriscar.
 */
export function gerarCsv(cabecalho: string[], linhas: (string | null)[][]): string {
  const tudo = [cabecalho, ...linhas];
  return BOM + tudo.map((linha) => linha.map(celula).join(SEPARADOR)).join('\r\n') + '\r\n';
}

export type LancamentoCsv = {
  cliente: string;
  /** Dia civil 'AAAA-MM-DD'. */
  data: string;
  tipo: 'venda' | 'pagamento';
  descricao: string | null;
  /** So em pagamento: dinheiro, pix, cartao, outro. */
  forma: string | null;
  valorCentavos: Centavos;
};

const NOME_DA_FORMA: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao: 'Cartão',
  outro: 'Outro',
};

/**
 * Todos os lancamentos da caderneta, uma linha cada.
 *
 * O valor sai sempre positivo e o sinal fica na coluna "Tipo". Exportar
 * pagamento como negativo pareceria mais pratico para somar, mas quem abre a
 * planilha quase sempre quer os dois totais separados — e um numero negativo
 * numa coluna chamada "Valor" e o tipo de coisa que gera duvida sobre se o app
 * lancou errado.
 */
export function csvLancamentos(lancamentos: LancamentoCsv[]): string {
  const emOrdem = [...lancamentos].sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return a.cliente.localeCompare(b.cliente, 'pt-BR');
  });

  return gerarCsv(
    ['Cliente', 'Data', 'Tipo', 'Descrição', 'Forma', 'Valor'],
    emOrdem.map((l) => [
      l.cliente,
      formatarDataBR(l.data),
      l.tipo === 'venda' ? 'Fiado' : 'Pagamento',
      l.descricao,
      l.forma == null ? null : (NOME_DA_FORMA[l.forma] ?? l.forma),
      formatarNumero(l.valorCentavos),
    ])
  );
}

export type ClienteCsv = {
  nome: string;
  telefone: string | null;
  saldoCentavos: Centavos;
  ultimaCompra: string | null;
  ultimoPagamento: string | null;
};

/** A lista de clientes com o saldo de cada um. */
export function csvClientes(clientes: ClienteCsv[]): string {
  return gerarCsv(
    ['Cliente', 'Telefone', 'Saldo', 'Última compra', 'Último pagamento'],
    clientes.map((c) => [
      c.nome,
      c.telefone,
      formatarNumero(c.saldoCentavos),
      c.ultimaCompra != null ? formatarDataBR(c.ultimaCompra) : null,
      c.ultimoPagamento != null ? formatarDataBR(c.ultimoPagamento) : null,
    ])
  );
}
