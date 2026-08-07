import { criarCliente, existeClienteComNome } from '@repo/core/db';
import { Botao, CampoTexto, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { db } from '@/db';

export default function NovoCliente() {
  const tema = useTema();

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const nomeLimpo = nome.trim();
    if (nomeLimpo === '') {
      setErroNome('O nome é obrigatório.');
      return;
    }

    setSalvando(true);
    try {
      if (await existeClienteComNome(db, nomeLimpo)) {
        const seguir = await confirmar(
          'Cliente repetido',
          `Já existe um cliente chamado "${nomeLimpo}". Cadastrar assim mesmo?`
        );
        if (!seguir) {
          setSalvando(false);
          return;
        }
      }

      const cliente = await criarCliente(db, { nome: nomeLimpo, apelido, telefone, observacao });
      router.replace(`/cliente/${cliente.id}`);
    } catch (erro) {
      Alert.alert('Não deu para salvar', String(erro));
      setSalvando(false);
    }
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
        espacoReservado="Ex.: João Eletricista"
        erro={erroNome}
        autoFoco
      />

      <CampoTexto
        rotulo="Apelido"
        valor={apelido}
        aoMudar={setApelido}
        espacoReservado="Como você chama ele"
      />

      <CampoTexto
        rotulo="Telefone"
        valor={telefone}
        aoMudar={setTelefone}
        espacoReservado="(00) 00000-0000"
        tipoTeclado="phone-pad"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo="Observação"
        valor={observacao}
        aoMudar={setObservacao}
        espacoReservado="Alguma anotação sobre o cliente"
        multilinha
        maiusculaInicial="sentences"
      />

      <Botao titulo="Salvar cliente" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}

function confirmar(titulo: string, mensagem: string): Promise<boolean> {
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: 'Cadastrar', onPress: () => resolver(true) },
    ]);
  });
}
