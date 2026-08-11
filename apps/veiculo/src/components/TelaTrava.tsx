import { Botao, useTema } from '@repo/ui';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { autenticarComBiometria, biometriaLigada, verificarPin } from '@/trava';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'apagar'];

/**
 * Tela de desbloqueio — mesmo componente do fiado e orcamento.
 *
 * Renderizada no lugar do app inteiro (no _layout raiz) e nao como rota,
 * porque rota exige navegacao e aqui o app precisa estar completamente bloqueado.
 * Teclado proprio para evitar variacao entre teclados do sistema (alguns
 * mostram sugestoes de texto, outros exibem o digito por um instante antes de
 * ocultar — comportamento nao deterministico que confunde o usuario).
 */
export function TelaTrava({ aoDestravar }: { aoDestravar: () => void }) {
  const tema = useTema();
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);
  const [temBiometria, setTemBiometria] = useState(false);

  useEffect(() => {
    biometriaLigada().then((ligada) => {
      setTemBiometria(ligada);
      if (ligada) tentarBiometria();
    });
    // Uma vez so, na abertura da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tentarBiometria() {
    if (await autenticarComBiometria()) aoDestravar();
  }

  async function digitar(tecla: string) {
    if (tecla === '') return;

    if (tecla === 'apagar') {
      setPin((atual) => atual.slice(0, -1));
      setErro(false);
      return;
    }

    if (pin.length >= 4) return;

    const novo = pin + tecla;
    setPin(novo);
    setErro(false);

    if (novo.length === 4) {
      if (await verificarPin(novo)) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        aoDestravar();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErro(true);
        setPin('');
      }
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tema.cores.fundo,
        justifyContent: 'center',
        padding: tema.espaco.xl,
        gap: tema.espaco.xxl,
      }}>
      <View style={{ alignItems: 'center', gap: tema.espaco.md }}>
        <Text
          style={{
            fontSize: tema.fonte.titulo,
            fontWeight: tema.peso.destaque,
            color: tema.cores.texto,
          }}>
          App trancado
        </Text>

        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          {erro ? 'PIN errado. Tente de novo.' : 'Digite seu PIN de 4 números'}
        </Text>

        <View style={{ flexDirection: 'row', gap: tema.espaco.lg, marginTop: tema.espaco.md }}>
          {[0, 1, 2, 3].map((indice) => (
            <View
              key={indice}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 2,
                borderColor: erro ? tema.cores.divida : tema.cores.bordaForte,
                backgroundColor:
                  indice < pin.length
                    ? erro
                      ? tema.cores.divida
                      : tema.cores.primaria
                    : 'transparent',
              }}
            />
          ))}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: tema.espaco.md,
        }}>
        {TECLAS.map((tecla, indice) => (
          <Pressable
            key={`${tecla}-${indice}`}
            onPress={() => digitar(tecla)}
            disabled={tecla === ''}
            accessibilityRole="button"
            accessibilityLabel={tecla === 'apagar' ? 'Apagar' : tecla}
            style={({ pressed }) => ({
              width: 88,
              height: 72,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: tema.raio.lg,
              backgroundColor:
                tecla === '' ? 'transparent' : pressed ? tema.cores.borda : tema.cores.superficie,
            })}>
            <Text
              style={{
                fontSize: tecla === 'apagar' ? tema.fonte.subtitulo : tema.fonte.titulo,
                fontWeight: tema.peso.medio,
                color: tema.cores.texto,
              }}>
              {tecla === 'apagar' ? '⌫' : tecla}
            </Text>
          </Pressable>
        ))}
      </View>

      {temBiometria && (
        <Botao titulo="Usar digital" variante="texto" aoTocar={tentarBiometria} />
      )}
    </View>
  );
}
