import { parseValorBR } from '@repo/core';
import { criarCliente, existeClienteComNome } from '@repo/core/db';
import { Botao, CampoTexto, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

export default function NovoCliente() {
  const tema = useTema();

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limite, setLimite] = useState('');
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
      // Cadastrar "Seu João" duas vezes e depois lancar fiado no cadastro errado
      // e um jeito silencioso de perder dinheiro. Avisamos, mas nao bloqueamos:
      // dois clientes com o mesmo nome existem de verdade.
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

      const cliente = await criarCliente(db, {
        nome: nomeLimpo,
        apelido,
        telefone,
        limiteCreditoCentavos: limite.trim() === '' ? null : parseValorBR(limite),
        observacao,
      });

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
        espacoReservado="Ex.: João da Silva"
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
          O app avisa quando o cliente passar desse valor. Ele continua podendo comprar.
        </Text>
      </View>

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
