import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTema } from './contexto';

export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'texto';

type Props = {
  titulo: string;
  aoTocar: () => void;
  variante?: VarianteBotao;
  desabilitado?: boolean;
  carregando?: boolean;
  /** Acao principal da tela: mais alta e ocupando a largura toda. */
  principal?: boolean;
  estilo?: ViewStyle;
};

export function Botao({
  titulo,
  aoTocar,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
  principal = false,
  estilo,
}: Props) {
  const tema = useTema();
  const inativo = desabilitado || carregando;
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  const { fundo, cor, borda } = useMemo(() => {
    switch (variante) {
      case 'secundario':
        return { fundo: tema.cores.superficieElevada, cor: tema.cores.primaria, borda: tema.cores.bordaCard };
      case 'perigo':
        return { fundo: tema.cores.divida, cor: tema.cores.textoInverso, borda: 'transparent' };
      case 'texto':
        return { fundo: 'transparent', cor: tema.cores.primaria, borda: 'transparent' };
      default:
        return { fundo: tema.cores.primaria, cor: tema.cores.textoInverso, borda: 'transparent' };
    }
  }, [variante, tema]);

  return (
    <Animated.View style={estiloAnimado}>
      <Pressable
        onPress={aoTocar}
        onPressIn={() => {
          // Scale sutil como reforco tatil do feedback ja existente de opacidade.
          // Dura pouco (100ms) de proposito: nunca pode atrasar a resposta ao
          // toque real, que dispara em paralelo via onPress.
          escala.value = withTiming(0.97, { duration: 100 });
        }}
        onPressOut={() => {
          escala.value = withTiming(1, { duration: 100 });
        }}
        disabled={inativo}
        accessibilityRole="button"
        accessibilityState={{ disabled: inativo, busy: carregando }}
        style={({ pressed }) => [
          {
            backgroundColor: inativo && variante !== 'texto' ? tema.cores.desabilitado : fundo,
            borderColor: borda,
            borderWidth: variante === 'secundario' ? 1 : 0,
            minHeight: principal ? tema.toque.principal : tema.toque.minimo,
            borderRadius: tema.raio.lg,
            paddingHorizontal: tema.espaco.lg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: tema.espaco.sm,
            // Feedback visual imediato: no balcao o usuario nem sempre olha a tela
            // ao tocar, entao a resposta precisa ser obvia.
            opacity: pressed ? 0.7 : 1,
            ...(variante === 'primario' ? tema.sombra.card : null),
          },
          estilo,
        ]}>
        {carregando && <ActivityIndicator size="small" color={cor} />}
        <Text
          style={[
            estilos.titulo,
            {
              color: inativo && variante !== 'texto' ? tema.cores.textoInverso : cor,
              fontSize: principal ? tema.fonte.subtitulo : tema.fonte.corpo,
            },
          ]}>
          {titulo}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
