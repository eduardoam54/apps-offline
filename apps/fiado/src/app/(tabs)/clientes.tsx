import { combinaComBusca } from '@repo/core';
import { consultaClientesComSaldo, type ClienteComSaldo } from '@repo/core/db';
import { Botao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';

import { LinhaCliente } from '@/components/LinhaCliente';
import { db } from '@/db';

export default function Clientes() {
  const tema = useTema();
  const [busca, setBusca] = useState('');
  const [soDevendo, setSoDevendo] = useState(false);

  const { data } = useLiveQuery(consultaClientesComSaldo(db), []);
  const todos = (data ?? []) as ClienteComSaldo[];

  // Filtragem em memoria, e nao em SQL: o LIKE do SQLite ignora acentuacao e
  // procurar "joao" precisa encontrar "João". Ver texto.ts no @repo/core.
  const visiveis = useMemo(() => {
    return todos.filter((c) => {
      if (soDevendo && c.saldoCentavos <= 0) return false;
      return combinaComBusca(busca, c.nome, c.apelido, c.telefone);
    });
  }, [todos, busca, soDevendo]);

  const devendo = todos.filter((c) => c.saldoCentavos > 0).length;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: tema.espaco.lg,
          gap: tema.espaco.md,
          backgroundColor: tema.cores.fundo,
          borderBottomWidth: 1,
          borderBottomColor: tema.cores.borda,
        }}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome ou telefone"
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

        {devendo > 0 && (
          <View style={{ flexDirection: 'row', gap: tema.espaco.sm }}>
            <Botao
              titulo="Todos"
              variante={soDevendo ? 'texto' : 'secundario'}
              aoTocar={() => setSoDevendo(false)}
              estilo={{ flex: 1 }}
            />
            <Botao
              titulo={`Devendo (${devendo})`}
              variante={soDevendo ? 'secundario' : 'texto'}
              aoTocar={() => setSoDevendo(true)}
              estilo={{ flex: 1 }}
            />
          </View>
        )}
      </View>

      <FlatList
        data={visiveis}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={visiveis.length === 0 ? { flexGrow: 1 } : undefined}
        renderItem={({ item }) => (
          <LinhaCliente cliente={item} aoTocar={() => router.push(`/cliente/${item.id}`)} />
        )}
        ListEmptyComponent={
          todos.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum cliente ainda"
              texto="Cadastre o primeiro cliente para começar a anotar o fiado."
              acao={{ titulo: 'Cadastrar cliente', aoTocar: () => router.push('/cliente/novo') }}
            />
          ) : (
            <EstadoVazio
              titulo="Nada encontrado"
              texto={
                busca !== ''
                  ? `Nenhum cliente combina com "${busca}".`
                  : 'Ninguém está devendo no momento.'
              }
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
        <Botao titulo="Novo cliente" principal aoTocar={() => router.push('/cliente/novo')} />
      </View>
    </View>
  );
}
