import { formatarBRL, formatarDataRelativa } from '@repo/core';
import type { StatusOrcamento } from '@repo/core/db';
import { LinhaLista, useTema } from '@repo/ui';

import { corDoStatus, rotuloStatus } from '@/status';

type Props = {
  numero: number;
  clienteNome: string;
  data: string;
  status: StatusOrcamento;
  totalCentavos: number;
  aoTocar: () => void;
};

/** Linha de orcamento na lista — interpreta status e valor, o mesmo papel que
 * LinhaCliente tem no fiado. */
export function LinhaOrcamento({ numero, clienteNome, data, status, totalCentavos, aoTocar }: Props) {
  const tema = useTema();

  return (
    <LinhaLista
      titulo={`#${numero} · ${clienteNome}`}
      subtitulo={rotuloStatus(status)}
      rodape={formatarDataRelativa(data)}
      valor={formatarBRL(totalCentavos)}
      corValor={corDoStatus(status, tema.cores)}
      aoTocar={aoTocar}
    />
  );
}
