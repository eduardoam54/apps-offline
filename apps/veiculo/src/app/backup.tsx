import { backupVeiculoLiberado, formatarDataBR, paraDataISO } from '@repo/core';
import { Botao, Cartao, Separador, useTema } from '@repo/ui';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import {
  escolherBackup,
  exportarECompartilhar,
  gravarCopiaAutomatica,
  listarCopiasAutomaticas,
  restaurarCopiaLocal,
  type CopiaLocal,
} from '@/backup';
import { useLicenca } from '@/licenca';

/**
 * Tela de backup do veiculo.
 *
 * Diferente do fiado e orcamento: o backup e um recurso do plano pago.
 * Usuarios gratuitos veem a tela mas nao conseguem exportar — sao convidados
 * a ver o plano.
 */
export default function TelaBackup() {
  const tema = useTema();
  const plano = useLicenca((e) => e.plano);
  const backupLiberado = backupVeiculoLiberado(plano);

  const [copias, setCopias] = useState<CopiaLocal[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = useCallback(() => {
    try {
      setCopias(listarCopiasAutomaticas());
    } catch {
      setCopias([]);
    }
  }, []);

  useFocusEffect(recarregar);

  async function exportar() {
    if (!backupLiberado) {
      router.push('/plano');
      return;
    }

    setOcupado(true);
    try {
      const compartilhou = await exportarECompartilhar();
      if (!compartilhou) {
        Alert.alert('Compartilhamento indisponível', 'Este aparelho não oferece o menu de compartilhar arquivos.');
      }
    } catch (falha) {
      Alert.alert('Não deu para exportar', String(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function importar() {
    if (!backupLiberado) {
      router.push('/plano');
      return;
    }

    setOcupado(true);
    try {
      const resultado = await escolherBackup();

      if (!resultado.ok) {
        if (resultado.erro != null) Alert.alert('Arquivo inválido', resultado.erro);
        return;
      }

      const { resumo, aplicar } = resultado.escolhido;

      Alert.alert(
        'Substituir os dados?',
        `O arquivo tem ${resumo.veiculos} ${resumo.veiculos === 1 ? 'veículo' : 'veículos'}, ` +
          `${resumo.abastecimentos} abastecimentos e ${resumo.manutencoes} manutenções.\n\n` +
          'Tudo que está no app agora será substituído. Uma cópia do estado atual é guardada antes.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Substituir',
            style: 'destructive',
            onPress: async () => {
              try {
                await aplicar();
                recarregar();
                Alert.alert('Pronto', 'Os dados foram restaurados.');
              } catch (falha) {
                Alert.alert('Não deu para restaurar', String(falha));
              }
            },
          },
        ]
      );
    } catch (falha) {
      Alert.alert('Não deu para abrir o arquivo', String(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function copiarAgora() {
    if (!backupLiberado) {
      router.push('/plano');
      return;
    }

    setOcupado(true);
    try {
      await gravarCopiaAutomatica(true);
      recarregar();
    } catch (falha) {
      Alert.alert('Não deu para copiar', String(falha));
    } finally {
      setOcupado(false);
    }
  }

  function restaurarLocal(copia: CopiaLocal) {
    Alert.alert(
      'Voltar para esta cópia?',
      `Tudo que está no app agora será substituído pelo conteúdo de ${
        copia.quando != null ? formatarDataBR(paraDataISO(copia.quando)) : copia.nome
      }.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              await gravarCopiaAutomatica(true);
              await restaurarCopiaLocal(copia.uri);
              recarregar();
              Alert.alert('Pronto', 'Os dados foram restaurados.');
            } catch (falha) {
              Alert.alert('Não deu para restaurar', String(falha));
            }
          },
        },
      ]
    );
  }

  const ultima = copias[0];

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
      {/* Banner de plano gratuito */}
      {!backupLiberado && (
        <Cartao estilo={{ backgroundColor: tema.cores.alertaFundo, gap: tema.espaco.md }}>
          <Text
            style={{
              fontSize: tema.fonte.corpo,
              fontWeight: tema.peso.forte,
              color: tema.cores.alerta,
            }}>
            Recurso do plano completo
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario, lineHeight: 22 }}>
            O backup é exclusivo para quem apoia o app. Ver o plano para desbloquear.
          </Text>
          <Botao titulo="Ver plano" principal aoTocar={() => router.push('/plano')} />
        </Cartao>
      )}

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Guardar fora do aparelho" />
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
          Gera um arquivo com todo o histórico de veículos. Mande para você mesmo no WhatsApp
          ou salve no Drive — é a única cópia que sobrevive se o celular for perdido.
        </Text>
        <Botao
          titulo="Exportar backup"
          principal={backupLiberado}
          variante={backupLiberado ? undefined : 'secundario'}
          carregando={ocupado}
          aoTocar={exportar}
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Restaurar de um arquivo" />
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
          Substitui tudo que está no app pelo conteúdo do arquivo. Você confere o que
          vem antes de confirmar.
        </Text>
        <Botao
          titulo="Escolher arquivo"
          variante="secundario"
          carregando={ocupado}
          aoTocar={importar}
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Cópias automáticas no aparelho" />
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
          O app guarda as {5} últimas cópias sozinho, uma por dia. Elas protegem contra
          apagar algo sem querer — mas ficam no próprio celular, então não substituem o
          backup exportado.
        </Text>

        <Cartao estilo={{ gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.corpo,
              color: tema.cores.texto,
              fontWeight: tema.peso.forte,
            }}>
            {ultima?.quando != null
              ? `Última cópia: ${formatarDataBR(paraDataISO(ultima.quando))}`
              : 'Nenhuma cópia ainda'}
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoFraco }}>
            {copias.length} {copias.length === 1 ? 'cópia guardada' : 'cópias guardadas'}
          </Text>
        </Cartao>

        <Botao
          titulo="Copiar agora"
          variante="secundario"
          carregando={ocupado}
          aoTocar={copiarAgora}
        />

        {copias.length > 0 && (
          <View
            style={{
              backgroundColor: tema.cores.fundo,
              borderRadius: tema.raio.lg,
              overflow: 'hidden',
              ...tema.sombra.card,
            }}>
            {copias.map((copia, indice) => (
              <View key={copia.uri}>
                {indice > 0 && <Separador />}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: tema.espaco.md,
                    padding: tema.espaco.lg,
                  }}>
                  <Text style={{ flex: 1, fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                    {copia.quando != null
                      ? formatarDataBR(paraDataISO(copia.quando))
                      : copia.nome}
                  </Text>
                  <Botao
                    titulo="Restaurar"
                    variante="texto"
                    aoTocar={() => restaurarLocal(copia)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Rotulo({ texto }: { texto: string }) {
  const tema = useTema();
  return (
    <Text
      style={{
        fontSize: tema.fonte.pequeno,
        fontWeight: tema.peso.forte,
        color: tema.cores.textoSecundario,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
      {texto}
    </Text>
  );
}
