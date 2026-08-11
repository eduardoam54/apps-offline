import { useMigracoes } from '@repo/core/db';
import { ProvedorTema, temaVeiculo } from '@repo/ui';
import '@/i18n';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { TelaTrava } from '@/components/TelaTrava';
import { db } from '@/db';
import { useLicenca } from '@/licenca';
import { temPinDefinido } from '@/trava';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const { success, error } = useMigracoes(db);
  const [travado, setTravado] = useState(false);
  const [verificouTrava, setVerificouTrava] = useState(false);
  const carregarLicenca = useLicenca((e) => e.carregar);

  useEffect(() => {
    carregarLicenca();
  }, [carregarLicenca]);

  const esquemaDoSistema = useColorScheme();
  const tema = esquemaDoSistema === 'dark' ? temaVeiculo.escuro : temaVeiculo.claro;

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

  useEffect(() => {
    if (!success) return;

    let ativo = true;

    temPinDefinido().then((tem) => {
      if (!ativo) return;
      setTravado(tem);
      setVerificouTrava(true);
    });

    return () => {
      ativo = false;
    };
  }, [success]);

  useEffect(() => {
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'background' || estado === 'inactive') {
        temPinDefinido().then((tem) => {
          if (tem) setTravado(true);
        });
      }
    });

    return () => inscricao.remove();
  }, []);

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
            O banco de dados do aparelho não pôde ser preparado. Seu histórico
            continua salvo — nada foi apagado.
          </Text>
          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, marginTop: tema.espaco.lg }}>
            {error.message}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!success || !verificouTrava) return null;

  if (travado) {
    return (
      <SafeAreaProvider>
        <ProvedorTema temas={temaVeiculo}>
          <StatusBar style={estiloStatusBar} />
          <TelaTrava aoDestravar={() => setTravado(false)} />
        </ProvedorTema>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProvedorTema temas={temaVeiculo}>
          <StatusBar style={estiloStatusBar} />
          <Stack screenOptions={opcoesCabecalho}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="veiculo/novo" options={{ title: t('tela.novoVeiculo') }} />
            <Stack.Screen name="veiculo/[id]/index" options={{ title: t('tela.veiculo') }} />
            <Stack.Screen name="veiculo/[id]/editar" options={{ title: t('tela.editarVeiculo') }} />
            <Stack.Screen name="veiculo/[id]/abastecimento/novo" options={{ title: t('tela.novoAbastecimento') }} />
            <Stack.Screen name="veiculo/[id]/manutencao/nova" options={{ title: t('tela.novaManutencao') }} />
            <Stack.Screen name="veiculo/[id]/lembrete/novo" options={{ title: t('tela.novoLembrete') }} />
            <Stack.Screen name="veiculo/[id]/historico" options={{ title: t('tela.historico') }} />
            <Stack.Screen name="plano" options={{ title: t('tela.plano') }} />
            <Stack.Screen name="seguranca" options={{ title: t('tela.travaDoApp') }} />
            <Stack.Screen name="backup" options={{ title: t('tela.backup') }} />
          </Stack>
        </ProvedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
