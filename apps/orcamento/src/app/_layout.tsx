import { useMigracoes } from '@repo/core/db';
import { ProvedorTema, temaOrcamento } from '@repo/ui';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TelaTrava } from '@/components/TelaTrava';
import { db } from '@/db';
import { useLicenca } from '@/licenca';
import { temPinDefinido } from '@/trava';

SplashScreen.preventAutoHideAsync();

/**
 * Layout raiz. Mais simples que o do fiado de proposito: sem onboarding no
 * MVP do orcamento — ver decisao registrada no README. A trava por PIN, no
 * entanto, e a mesma: o orcamento guarda telefone de cliente e dados da
 * empresa, e a mesma logica de "balconista bisbilhotando o celular no
 * balcao" se aplica.
 */
export default function RootLayout() {
  const { success, error } = useMigracoes(db);
  const [travado, setTravado] = useState(false);
  const [verificouTrava, setVerificouTrava] = useState(false);
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

  // Depois de migrar: ve se ha PIN.
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

  // Trava ao sair do app. Sem isso, deixar o celular no balcao com o app
  // aberto anularia a trava por completo.
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

  // Splash continua na tela ate migrar e conferir a trava.
  if (!success || !verificouTrava) return null;

  if (travado) {
    return (
      <SafeAreaProvider>
        <ProvedorTema temas={temaOrcamento}>
          <StatusBar style={estiloStatusBar} />
          <TelaTrava aoDestravar={() => setTravado(false)} />
        </ProvedorTema>
      </SafeAreaProvider>
    );
  }

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
            <Stack.Screen name="seguranca" options={{ title: 'Trava do app' }} />
          </Stack>
        </ProvedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
