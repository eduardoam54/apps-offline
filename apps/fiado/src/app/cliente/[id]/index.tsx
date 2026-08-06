import { formatarBRL, formatarDataRelativa } from '@repo/core';
import {
  arquivarCliente,
  consultaAcordosDoCliente,
  consultaClientesComSaldo,
  consultaPagamentosDoCliente,
  consultaVendasDoCliente,
  montarExtrato,
  type Acordo,
  type ClienteComSaldo,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, LinhaLista, Separador, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { cobrarNoWhatsApp } from '@/cobranca';
import { db } from '@/db';
import { useConfig } from '@/hooks/useConfig';

export default function DetalheCliente() {
  const tema = useTema();
  const config = useConfig();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: clientes } = useLiveQuery(consultaClientesComSaldo(db), []);
  const { data: vendas } = useLiveQuery(consultaVendasDoCliente(db, id), [id]);
  const { data: pagamentos } = useLiveQuery(consultaPagamentosDoCliente(db, id), [id]);
  const { data: acordos } = useLiveQuery(consultaAcordosDoCliente(db, id), [id]);

  const acordoAtivo = ((acordos ?? []) as Acordo[]).find((a) => a.status === 'ativo') ?? null;

  const cliente = ((clientes ?? []) as ClienteComSaldo[]).find((c) => c.id === id);

  const extrato = useMemo(
    () => montarExtrato((vendas ?? []) as never[], (pagamentos ?? []) as never[]),
    [vendas, pagamentos]
  );

  if (cliente == null) {
    return (
      <EstadoVazio
        titulo="Cliente não encontrado"
        texto="Ele pode ter sido arquivado."
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  const saldo = cliente.saldoCentavos;
  const deve = saldo > 0;
  const limite = cliente.limiteCreditoCentavos;
  const passouDoLimite = limite != null && saldo > limite;

  async function arquivar() {
    const aviso = deve
      ? `${cliente!.nome} ainda deve ${formatarBRL(saldo)}. Arquivar tira essa dívida do total a receber, mas o histórico fica guardado.`
      : 'O histórico fica guardado e você pode reativar depois.';

    Alert.alert('Arquivar cliente', aviso, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        style: 'destructive',
        onPress: async () => {
          await arquivarCliente(db, id);
          router.back();
        },
      },
    ]);
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
            style={{
              fontSize: tema.fonte.pequeno,
              color: tema.cores.textoSecundario,
              fontWeight: tema.peso.medio,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            {saldo < 0 ? 'Crédito a favor' : 'Deve'}
          </Text>

          <Text
            style={{
              fontSize: tema.fonte.gigante,
              fontWeight: tema.peso.destaque,
              color: deve ? tema.cores.divida : saldo < 0 ? tema.cores.pago : tema.cores.textoFraco,
            }}>
            {formatarBRL(Math.abs(saldo))}
          </Text>

          {cliente.apelido != null && (
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
              {cliente.apelido}
            </Text>
          )}

          {passouDoLimite && (
            <View
              style={{
                backgroundColor: tema.cores.alertaFundo,
                borderRadius: tema.raio.sm,
                padding: tema.espaco.md,
                marginTop: tema.espaco.sm,
              }}>
              <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta, fontWeight: tema.peso.forte }}>
                Passou do limite de {formatarBRL(limite)}
              </Text>
            </View>
          )}
        </Cartao>

        <View style={{ gap: tema.espaco.md }}>
          <View style={{ flexDirection: 'row', gap: tema.espaco.md }}>
            <Botao
              titulo="Lançar fiado"
              principal
              aoTocar={() => router.push(`/venda/nova?clienteId=${id}`)}
              estilo={{ flex: 1 }}
            />
            <Botao
              titulo="Receber"
              principal
              variante="secundario"
              desabilitado={saldo <= 0}
              aoTocar={() => router.push(`/pagamento/novo?clienteId=${id}`)}
              estilo={{ flex: 1 }}
            />
          </View>

          {deve && (
            <Botao
              titulo={
                cliente.telefone == null ? 'Cobrar (sem telefone)' : 'Cobrar no WhatsApp'
              }
              variante="secundario"
              desabilitado={cliente.telefone == null}
              aoTocar={() =>
                cobrarNoWhatsApp(
                  { id, nome: cliente.nome, telefone: cliente.telefone, saldoCentavos: saldo },
                  { nomeDaLoja: config.nomeDaLoja, template: config.templateCobranca }
                )
              }
            />
          )}

          {deve && acordoAtivo == null && (
            <Botao
              titulo="Parcelar a dívida"
              variante="texto"
              aoTocar={() => router.push(`/acordo/novo?clienteId=${id}`)}
            />
          )}
        </View>

        {acordoAtivo != null && (
          <Pressable onPress={() => router.push(`/acordo/${acordoAtivo.id}`)}>
            <Cartao estilo={{ gap: tema.espaco.xs, borderLeftWidth: 4, borderLeftColor: tema.cores.primaria }}>
              <Text
                style={{
                  fontSize: tema.fonte.pequeno,
                  color: tema.cores.textoSecundario,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: tema.peso.medio,
                }}>
                Acordo em andamento
              </Text>
              <Text
                style={{
                  fontSize: tema.fonte.subtitulo,
                  fontWeight: tema.peso.destaque,
                  color: tema.cores.texto,
                }}>
                {formatarBRL(acordoAtivo.valorTotalCentavos)} em {acordoAtivo.numParcelas}x
              </Text>
              <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoFraco }}>
                Toque para ver as parcelas
              </Text>
            </Cartao>
          </Pressable>
        )}

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
            Extrato
          </Text>

          {extrato.length === 0 ? (
            <Cartao estilo={{ alignItems: 'center', paddingVertical: tema.espaco.xl }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
                Nenhum lançamento ainda
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
              {extrato.map((item, indice) => (
                <View key={item.id}>
                  {indice > 0 && <Separador />}
                  <LinhaLista
                    titulo={item.tipo === 'venda' ? 'Fiado' : 'Pagamento'}
                    subtitulo={
                      item.descricao ??
                      (item.qtdItens > 0
                        ? `${item.qtdItens} ${item.qtdItens === 1 ? 'item' : 'itens'}`
                        : item.forma != null
                          ? nomeDaForma(item.forma)
                          : null)
                    }
                    rodape={formatarDataRelativa(item.data)}
                    valor={`${item.tipo === 'venda' ? '+' : '−'} ${formatarBRL(item.valorCentavos)}`}
                    corValor={item.tipo === 'venda' ? tema.cores.divida : tema.cores.pago}
                    aoTocar={
                      item.tipo === 'venda' ? () => router.push(`/venda/${item.id}`) : undefined
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <Botao titulo="Arquivar cliente" variante="texto" aoTocar={arquivar} />
      </ScrollView>
    </>
  );
}

function nomeDaForma(forma: string): string {
  const nomes: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao: 'Cartão',
    outro: 'Outro',
  };
  return nomes[forma] ?? forma;
}
