import { formatarBRL, formatarDataBR, formatarQuantidade, totalDoItem } from '@repo/core';
import {
  buscarVenda,
  consultaItensDaVenda,
  excluirVenda,
  useConsultaViva,
  type Venda,
  type VendaItem,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

export default function DetalheVenda() {
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venda, setVenda] = useState<Venda | null>(null);
  const [carregado, setCarregado] = useState(false);

  const { data: itensBrutos } = useConsultaViva(
    consultaItensDaVenda(db, id),
    ['venda_item'],
    [id]
  );
  const itens = (itensBrutos ?? []) as VendaItem[];

  useEffect(() => {
    let ativo = true;
    buscarVenda(db, id).then((linha) => {
      if (!ativo) return;
      setVenda(linha);
      setCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  if (!carregado) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={tema.cores.primaria} />
      </View>
    );
  }

  if (venda == null) {
    return (
      <EstadoVazio
        titulo="Lançamento não encontrado"
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  function excluir() {
    Alert.alert(
      'Excluir lançamento',
      'O valor sai do saldo do cliente. O registro continua guardado no aparelho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await excluirVenda(db, id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}>
      <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            color: tema.cores.textoSecundario,
            fontWeight: tema.peso.medio,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Fiado de {formatarDataBR(venda.data)}
        </Text>
        <Text
          style={{
            fontSize: tema.fonte.gigante,
            fontWeight: tema.peso.destaque,
            color: tema.cores.divida,
          }}>
          {formatarBRL(venda.valorCentavos)}
        </Text>
        {venda.descricao != null && (
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
            {venda.descricao}
          </Text>
        )}
      </Cartao>

      {itens.length > 0 && (
        <View style={{ gap: tema.espaco.sm }}>
          <Text
            style={{
              fontSize: tema.fonte.pequeno,
              fontWeight: tema.peso.forte,
              color: tema.cores.textoSecundario,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: tema.espaco.xs,
            }}>
            {itens.length === 1 ? '1 item' : `${itens.length} itens`}
          </Text>

          <View
            style={{
              backgroundColor: tema.cores.fundo,
              borderRadius: tema.raio.lg,
              overflow: 'hidden',
              ...tema.sombra.card,
            }}>
            {itens.map((item, indice) => (
              <View key={item.id}>
                {indice > 0 && <Separador />}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: tema.espaco.md,
                    padding: tema.espaco.lg,
                  }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                      {formatarQuantidade(item.quantidadeMilesimos)} × {item.descricao}
                    </Text>
                    <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
                      {formatarBRL(item.valorUnitarioCentavos)} cada
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: tema.fonte.corpo,
                      fontWeight: tema.peso.forte,
                      color: tema.cores.texto,
                    }}>
                    {formatarBRL(totalDoItem(item.valorUnitarioCentavos, item.quantidadeMilesimos))}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Botao titulo="Excluir lançamento" variante="texto" aoTocar={excluir} />
    </ScrollView>
  );
}
