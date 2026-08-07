import type { StatusOrcamento } from '@repo/core/db';

/**
 * Rotulo e cor de cada status — mora aqui, e nao em @repo/ui, porque o
 * SIGNIFICADO de "aprovado"/"recusado" e deste app. `pago`/`divida`/`alerta`
 * no tema foram pensados para dinheiro no fiado; aqui so emprestamos a cor.
 */
export function rotuloStatus(status: StatusOrcamento): string {
  if (status === 'aprovado') return 'Aprovado';
  if (status === 'recusado') return 'Recusado';
  return 'Em aberto';
}

export function corDoStatus(
  status: StatusOrcamento,
  cores: { pago: string; divida: string; textoFraco: string }
): string {
  if (status === 'aprovado') return cores.pago;
  if (status === 'recusado') return cores.divida;
  return cores.textoFraco;
}
