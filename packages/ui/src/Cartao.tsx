import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTema } from './contexto';

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: ViewStyle }) {
  const tema = useTema();

  return (
    <View
      style={[
        {
          backgroundColor: tema.cores.superficieElevada,
          borderRadius: tema.raio.xl,
          padding: tema.espaco.lg,
          borderWidth: 1,
          borderColor: tema.cores.bordaCard,
          ...tema.sombra.card,
        },
        estilo,
      ]}>
      {children}
    </View>
  );
}
