import { formatarBRL } from '@repo/core';
import { consultaClientesComSaldo, consultaTotalAReceber, type ClienteComSaldo } from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { LinhaCliente } from '@/components/LinhaCliente';
import { db } from '@/db';

const QUANTOS_DEVEDORES = 5;

export default function Inicio() {
  const tema = useTema();

  const { data: totais } = useLiveQuery(consultaTotalAReceber(db), []);
  const { data: clientes } = useLiveQuery(consultaClientesComSaldo(db), []);

  const aReceber = totais?.[0]?.total ?? 0;
  const lista = (clientes ?? []) as ClienteComSaldo[];
  const devedores = lista.filter((c) => c.saldoCentavos > 0);
  const topDevedores = devedores.slice(0, QUANTOS_DEVEDORES);

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
          Total a receber
        </Text>

        <Text
          style={{
            fontSize: tema.fonte.gigante,
            fontWeight: tema.peso.destaque,
            color: aReceber > 0 ? tema.cores.divida : tema.cores.textoFraco,
          }}>
          {formatarBRL(aReceber)}
        </Text>

        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
          {resumo(lista.length, devedores.length)}
        </Text>
      </Cartao>

      {lista.length === 0 ? (
        <EstadoVazio
          titulo="Sua caderneta está vazia"
          texto="Cadastre o primeiro cliente para começar a anotar o fiado."
          acao={{ titulo: 'Cadastrar cliente', aoTocar: () => router.push('/cliente/novo') }}
        />
      ) : (
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
            {devedores.length > 0 ? 'Quem mais deve' : 'Clientes'}
          </Text>

          {devedores.length === 0 ? (
            <Cartao estilo={{ alignItems: 'center', paddingVertical: tema.espaco.xl }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.pago, fontWeight: tema.peso.forte }}>
                Ninguém devendo no momento
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
              {topDevedores.map((cliente, indice) => (
                <View key={cliente.id}>
                  {indice > 0 && <Separador />}
                  <LinhaCliente
                    cliente={cliente}
                    aoTocar={() => router.push(`/cliente/${cliente.id}`)}
                  />
                </View>
              ))}
            </View>
          )}

          {devedores.length > QUANTOS_DEVEDORES && (
            <Botao
              titulo={`Ver todos os ${lista.length} clientes`}
              variante="texto"
              aoTocar={() => router.push('/clientes')}
            />
          )}

          <Botao
            titulo="Cadastrar cliente"
            variante="secundario"
            aoTocar={() => router.push('/cliente/novo')}
            estilo={{ marginTop: tema.espaco.sm }}
          />
        </View>
      )}
    </ScrollView>
  );
}

function resumo(total: number, devendo: number): string {
  if (total === 0) return 'Nenhum cliente cadastrado';
  if (devendo === 0) return `${total} ${total === 1 ? 'cliente' : 'clientes'} · ninguém devendo`;
  return `${devendo} de ${total} ${total === 1 ? 'cliente' : 'clientes'} devendo`;
}
