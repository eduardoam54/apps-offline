import { CHAVES, gravarConfig } from '@repo/core/db';
import { Botao, CampoTexto, useTema } from '@repo/ui';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

/**
 * Primeira abertura do app.
 *
 * UM CAMPO SO, E ELE E OPCIONAL. A promessa do app e nao ter burocracia; abrir
 * pela primeira vez e cair num formulario contradiz isso na primeira tela. Por
 * isso pede-se o nome da loja e mais nada, com saida explicita para quem quer
 * so comecar a anotar.
 *
 * O nome da loja nao e enfeite: ele assina a mensagem de cobranca que sai no
 * WhatsApp e o cabecalho do extrato em PDF. Sem ele, a cobranca diz "aqui na
 * nossa loja" e o documento vem assinado como "Caderneta" — funciona, mas
 * parece um app generico em vez do negocio do comerciante.
 *
 * Nao e rota, e renderizada no lugar do app: o mesmo motivo da trava. Como
 * rota, voltar no historico deixaria o usuario num app pela metade.
 */
export function TelaBoasVindas({ aoConcluir }: { aoConcluir: () => void }) {
  const tema = useTema();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function concluir() {
    setSalvando(true);
    try {
      const limpo = nome.trim();
      if (limpo !== '') await gravarConfig(db, CHAVES.nomeDaLoja, limpo);
      if (telefone.trim() !== '') await gravarConfig(db, CHAVES.telefoneDaLoja, telefone.trim());

      // Gravado por ultimo, de proposito: se o app for fechado no meio, o
      // onboarding aparece de novo em vez de sumir com os campos pela metade.
      await gravarConfig(db, CHAVES.onboardingConcluido, 'sim');
      aoConcluir();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tema.cores.fundo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: tema.espaco.xl,
          gap: tema.espaco.xl,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled">
        <View style={{ gap: tema.espaco.md }}>
          <Text
            style={{
              fontSize: tema.fonte.titulo,
              fontWeight: tema.peso.destaque,
              color: tema.cores.texto,
            }}>
            Sua caderneta digital
          </Text>
          <Text
            style={{
              fontSize: tema.fonte.corpo,
              color: tema.cores.textoSecundario,
              lineHeight: 26,
            }}>
            Anote o fiado, veja quem está devendo e cobre pelo WhatsApp. Tudo fica
            salvo só no seu aparelho — sem cadastro, sem mensalidade para começar e
            funcionando sem internet.
          </Text>
        </View>

        <View style={{ gap: tema.espaco.sm }}>
          <CampoTexto
            rotulo="Nome da sua loja"
            valor={nome}
            aoMudar={setNome}
            espacoReservado="Ex.: Mercadinho do Zé"
            autoFoco
          />
          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, lineHeight: 20 }}>
            É o nome que aparece na cobrança que você manda no WhatsApp e no extrato
            em PDF. Dá para mudar depois em Ajustes.
          </Text>
        </View>

        <CampoTexto
          rotulo="Seu telefone (opcional)"
          valor={telefone}
          aoMudar={setTelefone}
          espacoReservado="(00) 00000-0000"
          tipoTeclado="phone-pad"
          maiusculaInicial="none"
        />

        <View style={{ gap: tema.espaco.sm }}>
          <Botao
            titulo="Começar"
            principal
            carregando={salvando}
            aoTocar={concluir}
          />
          {nome.trim() === '' && (
            <Botao titulo="Depois eu preencho" variante="texto" aoTocar={concluir} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
