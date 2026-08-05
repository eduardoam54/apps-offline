import { formatarBRL } from '@repo/core';
import { cliente, pagamento, venda } from '@repo/core/db';
import { temaFiado as tema } from '@repo/ui';
import { count, isNull, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { db } from '@/db';

/**
 * Inicio.
 *
 * Esqueleto da tela principal. O numero grande no topo — total a receber — e a
 * unica informacao que o comerciante quer ver ao abrir o app, entao ele ocupa o
 * lugar de honra desde a primeira versao.
 *
 * As consultas usam useLiveQuery: quando uma venda for lancada em outra tela,
 * este total se atualiza sozinho, sem recarregar nada na mao.
 */
export default function Inicio() {
  const { data: somaVendas } = useLiveQuery(
    db
      .select({ valor: sql<number>`coalesce(sum(${venda.valorCentavos}), 0)` })
      .from(venda)
      .where(isNull(venda.deletadoEm))
  );

  const { data: somaPagamentos } = useLiveQuery(
    db
      .select({ valor: sql<number>`coalesce(sum(${pagamento.valorCentavos}), 0)` })
      .from(pagamento)
      .where(isNull(pagamento.deletadoEm))
  );

  const { data: totalClientes } = useLiveQuery(
    db.select({ quantidade: count() }).from(cliente).where(isNull(cliente.deletadoEm))
  );

  // Saldo e SEMPRE derivado: vendas menos pagamentos. Nunca uma coluna gravada.
  const aReceber = (somaVendas?.[0]?.valor ?? 0) - (somaPagamentos?.[0]?.valor ?? 0);
  const clientes = totalClientes?.[0]?.quantidade ?? 0;

  return (
    <>
      <Stack.Screen options={{ title: 'Fiado' }} />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.cartaoTotal}>
          <Text style={estilos.rotulo}>Total a receber</Text>
          <Text style={estilos.total}>{formatarBRL(aReceber)}</Text>
          <Text style={estilos.subtotal}>
            {clientes === 0
              ? 'Nenhum cliente cadastrado'
              : `${clientes} ${clientes === 1 ? 'cliente' : 'clientes'}`}
          </Text>
        </View>

        {clientes === 0 && (
          <View style={estilos.vazio}>
            <Text style={estilos.vazioTitulo}>Sua caderneta está vazia</Text>
            <Text style={estilos.vazioTexto}>
              Cadastre o primeiro cliente para começar a anotar o fiado.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: tema.espaco.lg,
    gap: tema.espaco.lg,
  },
  cartaoTotal: {
    backgroundColor: tema.cores.fundo,
    borderRadius: tema.raio.lg,
    padding: tema.espaco.xl,
    gap: tema.espaco.xs,
    ...tema.sombra.card,
  },
  rotulo: {
    fontSize: tema.fonte.pequeno,
    color: tema.cores.textoSecundario,
    fontWeight: tema.peso.medio,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  total: {
    fontSize: tema.fonte.gigante,
    fontWeight: tema.peso.destaque,
    color: tema.cores.divida,
  },
  subtotal: {
    fontSize: tema.fonte.corpo,
    color: tema.cores.textoFraco,
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: tema.espaco.xxxl,
    paddingHorizontal: tema.espaco.lg,
    gap: tema.espaco.sm,
  },
  vazioTitulo: {
    fontSize: tema.fonte.subtitulo,
    fontWeight: tema.peso.forte,
    color: tema.cores.texto,
  },
  vazioTexto: {
    fontSize: tema.fonte.corpo,
    color: tema.cores.textoSecundario,
    textAlign: 'center',
    lineHeight: 24,
  },
});
