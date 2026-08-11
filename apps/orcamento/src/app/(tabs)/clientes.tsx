import { combinaComBusca } from '@repo/core';
import { consultaClientesAtivos, useConsultaViva, type Cliente } from '@repo/core/db';
import { Botao, EstadoVazio, LinhaLista, Separador, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaClientes() {
  const tema = useTema();
  const { t } = useTranslation();
  const [busca, setBusca] = useState('');

  const { data } = useConsultaViva(consultaClientesAtivos(db), ['cliente'], []);
  const todos = (data ?? []) as Cliente[];

  const visiveis = useMemo(
    () => todos.filter((c) => combinaComBusca(busca, c.nome, c.apelido, c.telefone)),
    [todos, busca]
  );

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: tema.espaco.lg,
          backgroundColor: tema.cores.fundo,
          borderBottomWidth: 1,
          borderBottomColor: tema.cores.borda,
        }}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder={t('listaClientes.buscar')}
          placeholderTextColor={tema.cores.desabilitado}
          style={{
            minHeight: tema.toque.minimo,
            borderWidth: 1,
            borderColor: tema.cores.bordaForte,
            borderRadius: tema.raio.md,
            paddingHorizontal: tema.espaco.lg,
            fontSize: tema.fonte.corpo,
            color: tema.cores.texto,
          }}
        />
      </View>

      <FlatList
        data={visiveis}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={visiveis.length === 0 ? { flexGrow: 1 } : undefined}
        renderItem={({ item }) => (
          <LinhaLista
            titulo={item.nome}
            subtitulo={item.apelido}
            rodape={item.telefone}
            aoTocar={() => router.push(`/cliente/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          todos.length === 0 ? (
            <EstadoVazio
              icone="people-outline"
              titulo={t('listaClientes.nenhumAinda')}
              texto={t('listaClientes.crie')}
              acao={{ titulo: t('listaClientes.novoCliente'), aoTocar: () => router.push('/cliente/novo') }}
            />
          ) : (
            <EstadoVazio
              icone="search-off"
              titulo={t('listaClientes.nadaEncontrado')}
              texto={t('listaClientes.nenhunComBusca', { busca })}
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
        <Botao titulo={t('listaClientes.novoCliente')} principal aoTocar={() => router.push('/cliente/novo')} />
      </View>
    </View>
  );
}
