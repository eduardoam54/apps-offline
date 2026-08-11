import { consultaOrcamentos, TABELAS_DO_ORCAMENTO, useConsultaViva } from '@repo/core/db';
import { Botao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LinhaOrcamento } from '@/components/LinhaOrcamento';
import { db } from '@/db';
import { rotuloStatus } from '@/status';

type LinhaOrcamentoData = {
  id: string;
  numero: number;
  data: string;
  status: 'aberto' | 'aprovado' | 'recusado';
  totalCentavos: number;
  clienteId: string;
  clienteNome: string;
  criadoEm: string;
};

const FILTROS = ['todos', 'aberto', 'aprovado', 'recusado'] as const;
type Filtro = (typeof FILTROS)[number];

export default function TelaOrcamentos() {
  const tema = useTema();
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const { data } = useConsultaViva(consultaOrcamentos(db), TABELAS_DO_ORCAMENTO, []);
  const todos = (data ?? []) as LinhaOrcamentoData[];

  const visiveis = useMemo(
    () => (filtro === 'todos' ? todos : todos.filter((o) => o.status === filtro)),
    [todos, filtro]
  );

  return (
    <View style={{ flex: 1 }}>
      {todos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            padding: tema.espaco.lg,
            gap: tema.espaco.sm,
            backgroundColor: tema.cores.fundo,
            borderBottomWidth: 1,
            borderBottomColor: tema.cores.borda,
          }}>
          {FILTROS.map((f) => (
            <Botao
              key={f}
              titulo={f === 'todos' ? t('listaOrcamentos.todos') : rotuloStatus(f)}
              variante={filtro === f ? 'secundario' : 'texto'}
              aoTocar={() => setFiltro(f)}
            />
          ))}
        </ScrollView>
      )}

      <FlatList
        data={visiveis}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={visiveis.length === 0 ? { flexGrow: 1 } : undefined}
        renderItem={({ item }) => (
          <LinhaOrcamento
            numero={item.numero}
            clienteNome={item.clienteNome}
            data={item.data}
            status={item.status}
            totalCentavos={item.totalCentavos}
            aoTocar={() => router.push(`/orcamento/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          todos.length === 0 ? (
            <EstadoVazio
              icone="description"
              titulo={t('listaOrcamentos.nenhumAinda')}
              texto={t('listaOrcamentos.crie')}
              acao={{ titulo: t('listaOrcamentos.novoOrcamento'), aoTocar: () => router.push('/orcamento/novo') }}
            />
          ) : (
            <EstadoVazio
              icone="filter-list-off"
              titulo={t('listaOrcamentos.nadaPorAqui')}
              texto={`Nenhum orçamento ${rotuloStatus(filtro as Exclude<Filtro, 'todos'>).toLowerCase()}.`}
            />
          )
        }
      />

      <View
        style={{
          padding: tema.espaco.lg,
          backgroundColor: tema.cores.fundo,
          borderTopWidth: 1,
          borderTopColor: tema.cores.borda,
        }}>
        <Botao titulo={t('listaOrcamentos.novoOrcamento')} principal aoTocar={() => router.push('/orcamento/novo')} />
      </View>
    </View>
  );
}
