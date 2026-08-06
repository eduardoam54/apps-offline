import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTema } from './contexto';

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: ViewStyle }) {
  const tema = useTema();

  return (
    <View
      style={[
        {
          backgroundColor: tema.cores.fundo,
          borderRadius: tema.raio.lg,
          padding: tema.espaco.lg,
          ...tema.sombra.card,
        },
        estilo,
      ]}>
      {children}
    </View>
  );
}
