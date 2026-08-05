import { useMigracoes } from '@repo/core/db';
import { temaFiado as tema } from '@repo/ui';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/db';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigracoes(db);

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  // Banco que nao migrou e banco que nao pode ser usado. Seguir adiante aqui
  // arriscaria mostrar saldo errado — num app de caderneta, e o pior defeito
  // possivel. Melhor parar e dizer o que aconteceu.
  if (error) {
    return (
      <SafeAreaProvider>
        <View style={estilos.falha}>
          <Text style={estilos.falhaTitulo}>Não foi possível abrir a caderneta</Text>
          <Text style={estilos.falhaTexto}>
            O banco de dados do aparelho não pôde ser preparado. Seus lançamentos
            continuam salvos — nada foi apagado.
          </Text>
          <Text style={estilos.falhaDetalhe}>{error.message}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Splash continua na tela ate a migracao terminar.
  if (!success) return null;

  return (
    <SafeAreaProvider>
      {/* Com edge-to-edge (obrigatorio no Android 15+) a barra de status nao
          aceita mais cor de fundo — quem pinta atras dela e o header do Stack. */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tema.cores.primaria },
          headerTintColor: tema.cores.textoInverso,
          headerTitleStyle: { fontWeight: tema.peso.forte, fontSize: tema.fonte.subtitulo },
          contentStyle: { backgroundColor: tema.cores.superficie },
        }}
      />
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  falha: {
    flex: 1,
    justifyContent: 'center',
    padding: tema.espaco.xl,
    backgroundColor: tema.cores.fundo,
    gap: tema.espaco.md,
  },
  falhaTitulo: {
    fontSize: tema.fonte.titulo,
    fontWeight: tema.peso.destaque,
    color: tema.cores.texto,
  },
  falhaTexto: {
    fontSize: tema.fonte.corpo,
    color: tema.cores.textoSecundario,
    lineHeight: 24,
  },
  falhaDetalhe: {
    fontSize: tema.fonte.micro,
    color: tema.cores.textoFraco,
    marginTop: tema.espaco.lg,
  },
});
