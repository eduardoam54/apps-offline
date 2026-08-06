import { useMigracoes } from '@repo/core/db';
import { ProvedorTema, temaFiado as tema } from '@repo/ui';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { gravarCopiaAutomatica } from '@/backup';
import { TelaBoasVindas } from '@/components/TelaBoasVindas';
import { TelaTrava } from '@/components/TelaTrava';
import { db } from '@/db';
import { useConfig } from '@/hooks/useConfig';
import { useLicenca } from '@/licenca';
import { temPinDefinido } from '@/trava';

SplashScreen.preventAutoHideAsync();

const opcoesCabecalho = {
  headerStyle: { backgroundColor: tema.cores.primaria },
  headerTintColor: tema.cores.textoInverso,
  headerTitleStyle: { fontWeight: tema.peso.forte, fontSize: tema.fonte.subtitulo },
  contentStyle: { backgroundColor: tema.cores.superficie },
} as const;

export default function RootLayout() {
  const { success, error } = useMigracoes(db);
  const [travado, setTravado] = useState(false);
  const [verificouTrava, setVerificouTrava] = useState(false);
  const [passouBoasVindas, setPassouBoasVindas] = useState(false);
  const carregarLicenca = useLicenca((e) => e.carregar);
  const config = useConfig();

  // O plano vem de um arquivo local, nao do banco — ler cedo evita a tela
  // aparecer por um instante com os recursos pagos bloqueados para quem pagou.
  useEffect(() => {
    carregarLicenca();
  }, [carregarLicenca]);

  // A splash so sai quando da para decidir O QUE mostrar. Sem esperar a config,
  // o app apareceria por um instante antes de ser trocado pelas boas-vindas.
  useEffect(() => {
    if (error || (success && config.carregado)) {
      SplashScreen.hideAsync();
    }
  }, [success, error, config.carregado]);

  // Depois de migrar: ve se ha PIN e faz a copia automatica do dia.
  useEffect(() => {
    if (!success) return;

    let ativo = true;

    temPinDefinido().then((tem) => {
      if (!ativo) return;
      setTravado(tem);
      setVerificouTrava(true);
    });

    // A copia local roda em segundo plano e nunca pode impedir o app de abrir:
    // falhar em gravar backup e ruim, mas travar a caderneta por causa disso
    // seria pior.
    gravarCopiaAutomatica().catch(() => {});

    return () => {
      ativo = false;
    };
  }, [success]);

  // Trava ao sair do app. Sem isso, deixar o celular no balcao com o app aberto
  // anularia a trava por completo.
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

  // Splash continua na tela ate migrar, conferir a trava e ler a configuracao.
  if (!success || !verificouTrava || !config.carregado) return null;

  if (travado) {
    return (
      <SafeAreaProvider>
        <ProvedorTema tema={tema}>
          <StatusBar style="dark" />
          <TelaTrava aoDestravar={() => setTravado(false)} />
        </ProvedorTema>
      </SafeAreaProvider>
    );
  }

  // Depois da trava, nunca antes: quem tem PIN protegeu a caderneta inteira, e
  // as boas-vindas fazem parte dela.
  if (!config.onboardingConcluido && !passouBoasVindas) {
    return (
      <SafeAreaProvider>
        <ProvedorTema tema={tema}>
          <StatusBar style="dark" />
          <TelaBoasVindas aoConcluir={() => setPassouBoasVindas(true)} />
        </ProvedorTema>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProvedorTema tema={tema}>
          {/* Com edge-to-edge (obrigatorio no Android 15+) a barra de status nao
              aceita mais cor de fundo — quem pinta atras dela e o cabecalho. */}
          <StatusBar style="light" />
          <Stack screenOptions={opcoesCabecalho}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente' }} />
            <Stack.Screen name="cliente/[id]/index" options={{ title: 'Cliente' }} />
            <Stack.Screen name="cliente/[id]/editar" options={{ title: 'Editar cliente' }} />
            <Stack.Screen name="venda/nova" options={{ title: 'Lançar fiado' }} />
            <Stack.Screen name="venda/[id]" options={{ title: 'Lançamento' }} />
            <Stack.Screen name="pagamento/novo" options={{ title: 'Receber pagamento' }} />
            <Stack.Screen name="cobranca/lote" options={{ title: 'Cobrar clientes' }} />
            <Stack.Screen name="acordo/novo" options={{ title: 'Parcelar dívida' }} />
            <Stack.Screen name="acordo/[id]" options={{ title: 'Acordo' }} />
            <Stack.Screen name="exportar" options={{ title: 'Exportar' }} />
            <Stack.Screen name="plano" options={{ title: 'Plano' }} />
            <Stack.Screen name="backup" options={{ title: 'Backup' }} />
            <Stack.Screen name="seguranca" options={{ title: 'Trava do app' }} />
          </Stack>
        </ProvedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
