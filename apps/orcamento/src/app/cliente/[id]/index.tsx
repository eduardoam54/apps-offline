import {
  arquivarCliente,
  buscarCliente,
  consultaOrcamentosDoCliente,
  useConsultaViva,
  type Cliente,
  type Orcamento,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { LinhaOrcamento } from '@/components/LinhaOrcamento';
import { db } from '@/db';

export default function DetalheCliente() {
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const { data: orcamentos } = useConsultaViva(
    consultaOrcamentosDoCliente(db, id),
    ['orcamento'],
    [id]
  );

  useEffect(() => {
    let ativo = true;
    buscarCliente(db, id).then((c) => {
      if (ativo) setCliente(c);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  if (cliente == null) {
    return (
      <EstadoVazio
        titulo="Cliente não encontrado"
        texto="Ele pode ter sido excluído."
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  const lista = (orcamentos ?? []) as Orcamento[];

  async function excluir() {
    Alert.alert(
      'Excluir cliente',
      'O histórico de orçamentos fica guardado e você pode restaurar depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await arquivarCliente(db, id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: cliente.nome,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/cliente/${id}/editar`)} hitSlop={12}>
              <Text
                style={{
                  color: tema.cores.textoInverso,
                  fontSize: tema.fonte.corpo,
                  fontWeight: tema.peso.forte,
                }}>
                Editar
              </Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}>
        <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
          <Text
            style={{ fontSize: tema.fonte.titulo, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
            {cliente.nome}
          </Text>
          {cliente.apelido != null && (
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
              {cliente.apelido}
            </Text>
          )}
          {cliente.telefone != null && (
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
              {cliente.telefone}
            </Text>
          )}
        </Cartao>

        <Botao
          titulo="Novo orçamento"
          principal
          aoTocar={() => router.push(`/orcamento/novo?clienteId=${id}`)}
        />

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
            Orçamentos
          </Text>

          {lista.length === 0 ? (
            <Cartao estilo={{ alignItems: 'center', paddingVertical: tema.espaco.xl }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
                Nenhum orçamento ainda
              </Text>
            </Cartao>
          ) : (
            <View
              style={{
                backgroundColor: tema.cores.fundo,
                borderRadius: tema.raio.lg,
                overflow: 'hidden',
                ...tema.sombra.card,
              }}>
              {lista.map((orc, indice) => (
                <View key={orc.id}>
                  {indice > 0 && <Separador />}
                  <LinhaOrcamento
                    numero={orc.numero}
                    clienteNome={cliente.nome}
                    data={orc.data}
                    status={orc.status}
                    totalCentavos={orc.totalCentavos}
                    aoTocar={() => router.push(`/orcamento/${orc.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <Botao titulo="Excluir cliente" variante="texto" aoTocar={excluir} />
      </ScrollView>
    </>
  );
}
