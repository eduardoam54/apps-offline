import { Botao, Cartao, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  biometriaDisponivel,
  biometriaLigada,
  definirPin,
  ligarBiometria,
  removerPin,
  temPinDefinido,
} from '@/trava';

export default function Seguranca() {
  const tema = useTema();

  const [temPin, setTemPin] = useState(false);
  const [podeBiometria, setPodeBiometria] = useState(false);
  const [usaBiometria, setUsaBiometria] = useState(false);
  const [carregado, setCarregado] = useState(false);

  const [definindo, setDefinindo] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([temPinDefinido(), biometriaDisponivel(), biometriaLigada()]).then(
      ([tem, pode, usa]) => {
        setTemPin(tem);
        setPodeBiometria(pode);
        setUsaBiometria(usa);
        setCarregado(true);
      }
    );
  }, []);

  async function salvarPin() {
    if (!/^\d{4}$/.test(pin)) {
      setErro('O PIN precisa ter 4 números.');
      return;
    }
    if (pin !== confirmacao) {
      setErro('Os dois PINs não são iguais.');
      return;
    }

    try {
      await definirPin(pin);
      setTemPin(true);
      setDefinindo(false);
      setPin('');
      setConfirmacao('');
      setErro(null);
    } catch (falha) {
      setErro(String(falha));
    }
  }

  function desligarTrava() {
    Alert.alert(
      'Tirar a trava?',
      'Qualquer pessoa que pegar o celular destravado vai poder ver quanto cada cliente deve.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tirar trava',
          style: 'destructive',
          onPress: async () => {
            await removerPin();
            setTemPin(false);
            setUsaBiometria(false);
          },
        },
      ]
    );
  }

  async function alternarBiometria() {
    const novo = !usaBiometria;
    await ligarBiometria(novo);
    setUsaBiometria(novo);
  }

  if (!carregado) return null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}
      keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
        Com a trava ligada, o app pede o PIN toda vez que é aberto ou volta do
        segundo plano.
      </Text>

      {!temPin && !definindo && (
        <Botao titulo="Criar PIN" principal aoTocar={() => setDefinindo(true)} />
      )}

      {definindo && (
        <Cartao estilo={{ gap: tema.espaco.lg }}>
          <CampoPin rotulo="PIN de 4 números" valor={pin} aoMudar={setPin} />
          <CampoPin rotulo="Digite de novo" valor={confirmacao} aoMudar={setConfirmacao} />

          {erro != null && (
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
          )}

          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, lineHeight: 20 }}>
            Anote o PIN em algum lugar seguro. Ele não pode ser recuperado — se
            esquecer, só restaurando um backup.
          </Text>

          <Botao titulo="Salvar PIN" principal aoTocar={salvarPin} />
          <Botao
            titulo="Cancelar"
            variante="texto"
            aoTocar={() => {
              setDefinindo(false);
              setPin('');
              setConfirmacao('');
              setErro(null);
            }}
          />
        </Cartao>
      )}

      {temPin && (
        <View style={{ gap: tema.espaco.lg }}>
          <Cartao estilo={{ gap: tema.espaco.xs }}>
            <Text
              style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.pago }}>
              Trava ligada
            </Text>
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
              O app pede o PIN ao abrir.
            </Text>
          </Cartao>

          {podeBiometria && (
            <Pressable onPress={alternarBiometria}>
              <Cartao
                estilo={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tema.espaco.md,
                  minHeight: tema.toque.principal,
                }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: tema.fonte.corpo,
                      fontWeight: tema.peso.forte,
                      color: tema.cores.texto,
                    }}>
                    Desbloquear com digital
                  </Text>
                  <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
                    Mais rápido que digitar o PIN
                  </Text>
                </View>

                <View
                  style={{
                    width: 52,
                    height: 32,
                    borderRadius: tema.raio.pilula,
                    padding: 3,
                    justifyContent: 'center',
                    alignItems: usaBiometria ? 'flex-end' : 'flex-start',
                    backgroundColor: usaBiometria ? tema.cores.primaria : tema.cores.bordaForte,
                  }}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: tema.cores.fundo,
                    }}
                  />
                </View>
              </Cartao>
            </Pressable>
          )}

          <Botao
            titulo="Trocar PIN"
            variante="secundario"
            aoTocar={() => {
              setDefinindo(true);
              setPin('');
              setConfirmacao('');
              setErro(null);
            }}
          />
          <Botao titulo="Tirar a trava" variante="texto" aoTocar={desligarTrava} />
        </View>
      )}

      <Botao titulo="Voltar" variante="texto" aoTocar={() => router.back()} />
    </ScrollView>
  );
}

/**
 * Campo de PIN.
 *
 * `secureTextEntry` com teclado numerico e sem autocorrecao: o PIN nao pode
 * aparecer na tela nem entrar no dicionario do teclado do sistema.
 */
function CampoPin({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
}) {
  const tema = useTema();

  return (
    <View style={{ gap: tema.espaco.xs }}>
      <Text
        style={{
          fontSize: tema.fonte.pequeno,
          fontWeight: tema.peso.medio,
          color: tema.cores.textoSecundario,
        }}>
        {rotulo}
      </Text>
      <TextInput
        value={valor}
        onChangeText={(texto: string) => aoMudar(texto.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        autoCorrect={false}
        maxLength={4}
        style={{
          minHeight: tema.toque.principal,
          borderWidth: 1,
          borderColor: tema.cores.bordaForte,
          borderRadius: tema.raio.md,
          paddingHorizontal: tema.espaco.lg,
          fontSize: tema.fonte.titulo,
          letterSpacing: 12,
          color: tema.cores.texto,
          backgroundColor: tema.cores.fundo,
        }}
      />
    </View>
  );
}
