import { diasEntre, formatarBRL, hoje } from '@repo/core';
import type { ClienteComSaldo } from '@repo/core/db';
import { LinhaLista, useTema } from '@repo/ui';

/**
 * Linha de cliente na lista.
 *
 * Aqui mora a interpretacao do saldo — o que e divida, o que e credito, quando
 * o cliente passou do limite. O componente generico LinhaLista so sabe desenhar
 * um titulo e um valor; o significado e deste app.
 */
export function LinhaCliente({
  cliente,
  aoTocar,
}: {
  cliente: ClienteComSaldo;
  aoTocar: () => void;
}) {
  const tema = useTema();
  const saldo = cliente.saldoCentavos;

  const corValor =
    saldo > 0 ? tema.cores.divida : saldo < 0 ? tema.cores.pago : tema.cores.textoFraco;

  const limite = cliente.limiteCreditoCentavos;
  const passouDoLimite = limite != null && saldo > limite;

  return (
    <LinhaLista
      titulo={cliente.nome}
      subtitulo={cliente.apelido}
      valor={saldo < 0 ? `${formatarBRL(Math.abs(saldo))} cr` : formatarBRL(saldo)}
      corValor={corValor}
      rodape={passouDoLimite ? `Passou do limite de ${formatarBRL(limite)}` : descreverAtraso(cliente)}
      aoTocar={aoTocar}
    />
  );
}

/**
 * Ha quanto tempo o cliente nao paga.
 *
 * So aparece a partir de 30 dias: antes disso e cobranca normal do dia a dia e
 * marcar todo mundo de vermelho ensinaria o comerciante a ignorar o aviso.
 */
function descreverAtraso(cliente: ClienteComSaldo): string | null {
  if (cliente.saldoCentavos <= 0) return null;

  const referencia = cliente.ultimoPagamento ?? cliente.ultimaCompra;
  if (referencia == null) return null;

  const dias = diasEntre(referencia, hoje());
  if (dias < 30) return null;

  if (cliente.ultimoPagamento == null) return `Nunca pagou · ${dias} dias`;
  return `Sem pagar há ${dias} dias`;
}
