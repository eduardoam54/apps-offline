import { formatarBRL, formatarDataBR, somar, type Centavos } from '@repo/core';

import { escaparHtml, paginaHtml } from './html';

/**
 * Relatorio de quem esta devendo, em PDF.
 *
 * Diferente do extrato, este documento e do comerciante PARA O COMERCIANTE:
 * imprimir e deixar embaixo do balcao, ou mandar para o socio. Por isso traz
 * telefone e data da ultima compra, que sao dados internos e nunca apareceriam
 * num documento entregue ao cliente.
 */

export type Devedor = {
  nome: string;
  telefone: string | null;
  saldoCentavos: Centavos;
  /** Dia civil da compra mais recente. null quando so ha pagamento. */
  ultimaCompra: string | null;
};

export type DadosRelatorio = {
  loja: { nome: string; telefone: string | null };
  clientes: Devedor[];
  /** Dia civil da emissao. */
  geradoEm: string;
};

/** Telefone e guardado so com digitos; aqui ele vira legivel para leitura humana. */
export function formatarTelefone(telefone: string | null): string {
  if (telefone == null) return '';

  const d = telefone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

export function htmlRelatorioDevedores(dados: DadosRelatorio): string {
  // So quem deve. Cliente zerado ou com credito a favor nao pertence a um
  // documento cujo titulo e "quem esta devendo" — ele so faria o comerciante
  // procurar num relatorio mais longo do que precisava ser.
  const devedores = dados.clientes
    .filter((c) => c.saldoCentavos > 0)
    .sort((a, b) => b.saldoCentavos - a.saldoCentavos || a.nome.localeCompare(b.nome, 'pt-BR'));

  const total = somar(...devedores.map((c) => c.saldoCentavos));

  const linhas = devedores.map(
    (c) => `<tr>
      <td>${escaparHtml(c.nome)}${
        c.telefone ? `<div class="fraco">${escaparHtml(formatarTelefone(c.telefone))}</div>` : ''
      }</td>
      <td class="fraco">${c.ultimaCompra != null ? formatarDataBR(c.ultimaCompra) : '—'}</td>
      <td class="numero divida">${formatarBRL(c.saldoCentavos)}</td>
    </tr>`
  );

  const corpo =
    devedores.length === 0
      ? '<p class="fraco">Ninguém está devendo. A caderneta está zerada.</p>'
      : `<table>
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Última compra</th>
        <th class="numero">Deve</th>
      </tr>
    </thead>
    <tbody>${linhas.join('')}</tbody>
  </table>
  <div class="total">
    <span class="total-rotulo">Total a receber</span>
    <span class="total-valor divida">${formatarBRL(total)}</span>
  </div>`;

  const quantos =
    devedores.length === 1 ? '1 cliente devendo' : `${devedores.length} clientes devendo`;

  return paginaHtml({
    titulo: 'Clientes devendo',
    loja: dados.loja.nome,
    lojaContato: dados.loja.telefone,
    tipo: 'Relatório interno',
    assunto: quantos,
    corpo,
    rodape: `Emitido em ${formatarDataBR(dados.geradoEm)}. Documento gerado pelo aplicativo, sem valor fiscal.`,
  });
}
