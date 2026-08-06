import { formatarBRL, formatarDataBR, somar, subtrair, type Centavos } from '@repo/core';

import { escaparHtml, escaparOpcional, paginaHtml } from './html';

/**
 * Extrato de um cliente, em PDF.
 *
 * E o documento que o comerciante manda pelo WhatsApp quando o cliente
 * pergunta "mas eu devo tudo isso?". Ele so cumpre esse papel se o cliente
 * conseguir CONFERIR a conta sozinho — por isso a coluna de saldo acumulado,
 * que mostra a divida subindo e descendo lancamento a lancamento.
 */

export type LancamentoExtrato = {
  tipo: 'venda' | 'pagamento';
  /** Dia civil 'AAAA-MM-DD'. */
  data: string;
  descricao: string | null;
  valorCentavos: Centavos;
  /** Desempata lancamentos do mesmo dia na ordem em que foram feitos. */
  criadoEm: string;
};

export type DadosExtrato = {
  loja: { nome: string; telefone: string | null };
  cliente: { nome: string; telefone: string | null };
  /**
   * O historico COMPLETO do cliente, em qualquer ordem.
   *
   * Precisa ser completo porque o saldo final impresso e somado daqui — ver o
   * comentario de `saldoFinal` logo abaixo.
   */
  lancamentos: LancamentoExtrato[];
  /** Dia civil da emissao. */
  geradoEm: string;
};

/**
 * Ordena do mais antigo para o mais novo.
 *
 * Ao contrario da tela, onde o mais recente vem primeiro porque e o que o
 * comerciante acabou de lancar, o documento impresso vai na ordem cronologica:
 * e assim que se le uma conta, e e a unica ordem em que o saldo acumulado faz
 * sentido.
 */
function emOrdemCronologica(lancamentos: LancamentoExtrato[]): LancamentoExtrato[] {
  return [...lancamentos].sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return a.criadoEm < b.criadoEm ? -1 : 1;
  });
}

/**
 * Saldo somado a partir dos proprios lancamentos impressos.
 *
 * Deliberadamente NAO recebemos o saldo pronto da consulta SQL. Se o total do
 * rodape viesse de uma fonte e as linhas de outra, bastaria um lancamento fora
 * da lista para o documento se contradizer — e um extrato cuja conta nao fecha
 * e pior do que nenhum extrato: o cliente para de acreditar na caderneta
 * inteira. Somando o que esta impresso, o documento e sempre coerente consigo
 * mesmo.
 */
export function saldoFinal(lancamentos: LancamentoExtrato[]): Centavos {
  const vendas = lancamentos.filter((l) => l.tipo === 'venda').map((l) => l.valorCentavos);
  const pagamentos = lancamentos.filter((l) => l.tipo === 'pagamento').map((l) => l.valorCentavos);

  return subtrair(somar(...vendas), somar(...pagamentos));
}

export function htmlExtratoCliente(dados: DadosExtrato): string {
  const lancamentos = emOrdemCronologica(dados.lancamentos);

  let acumulado = 0;
  const linhas = lancamentos.map((l) => {
    acumulado =
      l.tipo === 'venda'
        ? somar(acumulado, l.valorCentavos)
        : subtrair(acumulado, l.valorCentavos);

    const rotulo = l.tipo === 'venda' ? 'Fiado' : 'Pagamento';
    const sinal = l.tipo === 'venda' ? '+' : '−';
    const classe = l.tipo === 'venda' ? 'divida' : 'pago';

    return `<tr>
      <td>${formatarDataBR(l.data)}</td>
      <td>${escaparHtml(rotulo)}${
        l.descricao ? `<div class="fraco">${escaparOpcional(l.descricao)}</div>` : ''
      }</td>
      <td class="numero ${classe}">${sinal} ${formatarBRL(l.valorCentavos)}</td>
      <td class="numero">${formatarBRL(acumulado)}</td>
    </tr>`;
  });

  const total = saldoFinal(lancamentos);

  const corpo =
    lancamentos.length === 0
      ? '<p class="fraco">Nenhum lançamento registrado.</p>'
      : `<table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Lançamento</th>
        <th class="numero">Valor</th>
        <th class="numero">Saldo</th>
      </tr>
    </thead>
    <tbody>${linhas.join('')}</tbody>
  </table>
  <div class="total">
    <span class="total-rotulo">${total < 0 ? 'Crédito a favor' : 'Saldo devedor'}</span>
    <span class="total-valor ${total > 0 ? 'divida' : 'pago'}">${formatarBRL(Math.abs(total))}</span>
  </div>`;

  return paginaHtml({
    titulo: `Extrato de ${dados.cliente.nome}`,
    loja: dados.loja.nome,
    lojaContato: dados.loja.telefone,
    tipo: 'Extrato do cliente',
    assunto: dados.cliente.nome,
    corpo,
    rodape: `Emitido em ${formatarDataBR(dados.geradoEm)}. Documento gerado pelo aplicativo, sem valor fiscal.`,
  });
}
