import { diaDoInstante, formatarBRL, hoje } from '@repo/core';
import { consultaClientesComSaldo, type ClienteComSaldo } from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import { cobrarNoWhatsApp } from '@/cobranca';
import { db } from '@/db';
import { useConfig } from '@/hooks/useConfig';

/**
 * Cobranca em lote.
 *
 * Nao e um assistente que forca uma ordem: e uma lista com um botao por cliente.
 * O comerciante sabe quem vale a pena cobrar hoje e quem e melhor deixar quieto,
 * e um fluxo obrigatorio passo a passo tiraria essa decisao dele.
 *
 * Quem ja foi cobrado hoje aparece marcado — e o que evita mandar a mesma
 * mensagem duas vezes para a mesma pessoa no mesmo dia.
 */
export default function CobrancaEmLote() {
  const tema = useTema();
  const config = useConfig();

  const { data } = useLiveQuery(consultaClientesComSaldo(db), []);
  const todos = (data ?? []) as ClienteComSaldo[];

  const devedores = useMemo(() => todos.filter((c) => c.saldoCentavos > 0), [todos]);
  const jaCobrados = devedores.filter(cobradoHoje).length;
  const semTelefone = devedores.filter((c) => c.telefone == null).length;

  if (devedores.length === 0) {
    return (
      <EstadoVazio
        titulo="Ninguém devendo"
        texto="Não há cobrança para fazer no momento."
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Cartao estilo={{ margin: tema.espaco.lg, gap: tema.espaco.xs }}>
        <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
          {jaCobrados} de {devedores.length} cobrados hoje
        </Text>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
          O WhatsApp abre com a mensagem pronta. Você revisa e envia.
        </Text>
        {semTelefone > 0 && (
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta }}>
            {semTelefone} {semTelefone === 1 ? 'cliente sem telefone' : 'clientes sem telefone'} cadastrado.
          </Text>
        )}
      </Cartao>

      <FlatList
        data={devedores}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separador}
        renderItem={({ item }) => {
          const cobrado = cobradoHoje(item);
          const temTelefone = item.telefone != null;

          return (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tema.espaco.md,
                padding: tema.espaco.lg,
                backgroundColor: tema.cores.fundo,
              }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: tema.fonte.corpo,
                    fontWeight: tema.peso.forte,
                    color: cobrado ? tema.cores.textoFraco : tema.cores.texto,
                  }}>
                  {item.nome}
                </Text>
                <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>
                  {formatarBRL(item.saldoCentavos)}
                </Text>
                {cobrado && (
                  <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.pago }}>
                    Cobrado hoje
                  </Text>
                )}
                {!temTelefone && (
                  <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.alerta }}>
                    Sem telefone
                  </Text>
                )}
              </View>

              <Botao
                titulo={cobrado ? 'Cobrar de novo' : 'Cobrar'}
                variante={cobrado ? 'texto' : 'primario'}
                desabilitado={!temTelefone}
                aoTocar={() =>
                  cobrarNoWhatsApp(
                    {
                      id: item.id,
                      nome: item.nome,
                      telefone: item.telefone,
                      saldoCentavos: item.saldoCentavos,
                    },
                    { nomeDaLoja: config.nomeDaLoja, template: config.templateCobranca }
                  )
                }
              />
            </View>
          );
        }}
      />
    </View>
  );
}

function cobradoHoje(cliente: ClienteComSaldo): boolean {
  if (cliente.ultimaCobranca == null) return false;
  // `cobrado_em` e um instante em UTC: precisa virar dia civil local antes de
  // comparar, senao toda cobranca feita a noite conta como sendo do dia seguinte.
  return diaDoInstante(cliente.ultimaCobranca) === hoje();
}
