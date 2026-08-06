import { desc, sql } from 'drizzle-orm';

import { agora } from '../../date';
import { novoId } from '../../id';
import type { Centavos } from '../../money';
import { produtoFrequente } from '../schema';
import type { BancoSQLite } from '../tipos';

/**
 * Catalogo que se monta sozinho.
 *
 * Nao existe tela de "cadastrar produto" — seria exatamente a burocracia que o
 * app promete nao ter. O catalogo e alimentado pelo uso: cada item lancado
 * incrementa um contador, e quanto mais o comerciante lanca "pao frances", mais
 * alto ele aparece na sugestao da proxima venda.
 */

export type ItemParaRegistrar = {
  descricao: string;
  valorUnitarioCentavos: Centavos;
};

/**
 * Registra os itens usados numa venda.
 *
 * O valor padrao e sobrescrito pelo mais recente de proposito: preco de mercado
 * sobe, e sugerir o preco de tres meses atras seria pior do que nao sugerir nada.
 */
export async function registrarProdutos(
  db: BancoSQLite,
  itens: ItemParaRegistrar[]
): Promise<void> {
  for (const item of itens) {
    const descricao = item.descricao.trim();
    if (descricao === '') continue;

    await db
      .insert(produtoFrequente)
      .values({
        id: novoId(),
        descricao,
        valorPadraoCentavos: item.valorUnitarioCentavos,
        usos: 1,
        atualizadoEm: agora(),
      })
      .onConflictDoUpdate({
        target: produtoFrequente.descricao,
        set: {
          usos: sql`${produtoFrequente.usos} + 1`,
          valorPadraoCentavos: item.valorUnitarioCentavos,
          atualizadoEm: agora(),
        },
      });
  }
}

/** Os mais usados primeiro; empate resolve pelo mais recente. */
export function consultaProdutosFrequentes(db: BancoSQLite, limite = 8) {
  return db
    .select()
    .from(produtoFrequente)
    .orderBy(desc(produtoFrequente.usos), desc(produtoFrequente.atualizadoEm))
    .limit(limite);
}
