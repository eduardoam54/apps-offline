import { formatarNumero, parseValorBR } from '@repo/core';
import { atualizarCliente, buscarCliente, type Cliente } from '@repo/core/db';
import { Botao, CampoTexto, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

export default function EditarCliente() {
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [carregado, setCarregado] = useState(false);
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limite, setLimite] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    buscarCliente(db, id).then((cliente: Cliente | null) => {
      if (!ativo || cliente == null) return;
      setNome(cliente.nome);
      setApelido(cliente.apelido ?? '');
      setTelefone(cliente.telefone ?? '');
      setLimite(
        cliente.limiteCreditoCentavos == null ? '' : formatarNumero(cliente.limiteCreditoCentavos)
      );
      setObservacao(cliente.observacao ?? '');
      setCarregado(true);
    });

    return () => {
      ativo = false;
    };
  }, [id]);

  async function salvar() {
    if (nome.trim() === '') {
      setErroNome('O nome é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      await atualizarCliente(db, id, {
        nome,
        apelido,
        telefone,
        limiteCreditoCentavos: limite.trim() === '' ? null : parseValorBR(limite),
        observacao,
      });
      router.back();
    } catch (erro) {
      Alert.alert('Não deu para salvar', String(erro));
      setSalvando(false);
    }
  }

  if (!carregado) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={tema.cores.primaria} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <CampoTexto
        rotulo="Nome *"
        valor={nome}
        aoMudar={(t) => {
          setNome(t);
          if (erroNome != null) setErroNome(null);
        }}
        erro={erroNome}
      />

      <CampoTexto rotulo="Apelido" valor={apelido} aoMudar={setApelido} />

      <CampoTexto
        rotulo="Telefone"
        valor={telefone}
        aoMudar={setTelefone}
        tipoTeclado="phone-pad"
        maiusculaInicial="none"
      />

      <View style={{ gap: tema.espaco.xs }}>
        <CampoTexto
          rotulo="Limite de fiado"
          valor={limite}
          aoMudar={setLimite}
          espacoReservado="Deixe vazio para não ter limite"
          tipoTeclado="decimal-pad"
          maiusculaInicial="none"
        />
        <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
          O app avisa quando o cliente passar desse valor.
        </Text>
      </View>

      <CampoTexto
        rotulo="Observação"
        valor={observacao}
        aoMudar={setObservacao}
        multilinha
        maiusculaInicial="sentences"
      />

      <Botao titulo="Salvar alterações" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
