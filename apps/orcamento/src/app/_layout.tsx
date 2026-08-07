import { useMigracoes } from '@repo/core/db';
import { ProvedorTema, temaOrcamento } from '@repo/ui';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/db';
import { useLicenca } from '@/licenca';

SplashScreen.preventAutoHideAsync();

/**
 * Layout raiz. Mais simples que o do fiado de proposito: sem trava por PIN e
 * sem onboarding no MVP do orcamento — ver decisao registrada no README.
 */
export default function RootLayout() {
  const { success, error } = useMigracoes(db);
  const carregarLicenca = useLicenca((e) => e.carregar);

  // O plano vem de um arquivo local, nao do banco — ler cedo evita a tela
  // aparecer por um instante com os recursos pagos bloqueados para quem pagou.
  useEffect(() => {
    carregarLicenca();
  }, [carregarLicenca]);

  // O provedor resolve o mesmo esquema, mas o cabecalho do Stack e a StatusBar
  // sao configurados aqui em cima, fora do contexto — precisam do tema ja
  // resolvido antes de existir provedor.
  const esquemaDoSistema = useColorScheme();
  const tema = esquemaDoSistema === 'dark' ? temaOrcamento.escuro : temaOrcamento.claro;

  const opcoesCabecalho = useMemo(
    () =>
      ({
        headerStyle: { backgroundColor: tema.cores.primaria },
        headerTintColor: tema.cores.textoInverso,
        headerTitleStyle: { fontWeight: tema.peso.forte, fontSize: tema.fonte.subtitulo },
        contentStyle: { backgroundColor: tema.cores.superficie },
      }) as const,
    [tema],
  );

  const estiloStatusBar = tema.modo === 'escuro' ? 'light' : 'dark';

  useEffect(() => {
    if (error || success) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  // Banco que nao migrou e banco que nao pode ser usado. Seguir adiante aqui
  // arriscaria mostrar um orcamento com valor errado. Melhor parar e dizer o
  // que aconteceu.
  if (error) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: tema.espaco.xl,
            backgroundColor: tema.cores.fundo,
            gap: tema.espaco.md,
          }}>
          <Text style={{ fontSize: tema.fonte.titulo, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
            Não foi possível abrir o app
          </Text>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
            O banco de dados do aparelho não pôde ser preparado. Seus orçamentos
            continuam salvos — nada foi apagado.
          </Text>
          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, marginTop: tema.espaco.lg }}>
            {error.message}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Splash continua na tela ate migrar.
  if (!success) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProvedorTema temas={temaOrcamento}>
          {/* Com edge-to-edge (obrigatorio no Android 15+) a barra de status nao
              aceita mais cor de fundo — quem pinta atras dela e o cabecalho. */}
          <StatusBar style={estiloStatusBar} />
          <Stack screenOptions={opcoesCabecalho}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente' }} />
            <Stack.Screen name="cliente/[id]/index" options={{ title: 'Cliente' }} />
            <Stack.Screen name="cliente/[id]/editar" options={{ title: 'Editar cliente' }} />
            <Stack.Screen name="orcamento/novo" options={{ title: 'Novo orçamento' }} />
            <Stack.Screen name="orcamento/[id]/index" options={{ title: 'Orçamento' }} />
            <Stack.Screen name="orcamento/[id]/editar" options={{ title: 'Editar orçamento' }} />
            <Stack.Screen name="plano" options={{ title: 'Plano' }} />
          </Stack>
        </ProvedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
