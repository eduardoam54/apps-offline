import { diasEntre, formatarBRL, formatarDataBR, hoje, somar } from '@repo/core';
import {
  consultaParcelasDoAcordo,
  quebrarAcordo,
  quitarParcela,
  useConsultaViva,
  type Acordo,
  type AcordoParcela,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { acordo as tabelaAcordo } from '@repo/core/db';
import { eq } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

export default function DetalheAcordo() {
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Quitar a ultima parcela marca a parcela E fecha o acordo, entao as duas
  // consultas escutam as duas tabelas: sem isso o cabecalho continuaria dizendo
  // "ativo" com todas as parcelas ja pagas na lista logo abaixo.
  const { data: acordos } = useConsultaViva(
    db.select().from(tabelaAcordo).where(eq(tabelaAcordo.id, id)),
    ['acordo', 'acordo_parcela'],
    [id]
  );
  const { data: parcelasBrutas } = useConsultaViva(
    consultaParcelasDoAcordo(db, id),
    ['acordo_parcela', 'acordo'],
    [id]
  );

  const acordo = ((acordos ?? []) as Acordo[])[0];
  const parcelas = (parcelasBrutas ?? []) as AcordoParcela[];

  if (acordo == null) {
    return (
      <EstadoVazio
        titulo="Acordo não encontrado"
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  const pagas = parcelas.filter((p) => p.pagoEm != null);
  const emAberto = parcelas.filter((p) => p.pagoEm == null);
  const faltaPagar = emAberto.length === 0 ? 0 : somar(...emAberto.map((p) => p.valorCentavos));

  function confirmarQuitacao(parcela: AcordoParcela) {
    Alert.alert(
      `Parcela ${parcela.numero}`,
      `Registrar o recebimento de ${formatarBRL(parcela.valorCentavos)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recebi',
          onPress: async () => {
            try {
              await quitarParcela(db, parcela.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (falha) {
              Alert.alert('Não deu para registrar', String(falha));
            }
          },
        },
      ]
    );
  }

  function confirmarQuebra() {
    Alert.alert(
      'Cancelar o acordo',
      'O que o cliente já pagou continua abatido. Cancelar só significa que o combinado deixou de valer.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar acordo',
          style: 'destructive',
          onPress: async () => {
            await quebrarAcordo(db, id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}>
      <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            color: tema.cores.textoSecundario,
            fontWeight: tema.peso.medio,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          {rotuloStatus(acordo.status)}
        </Text>

        <Text
          style={{
            fontSize: tema.fonte.gigante,
            fontWeight: tema.peso.destaque,
            color: acordo.status === 'cumprido' ? tema.cores.pago : tema.cores.texto,
          }}>
          {formatarBRL(acordo.valorTotalCentavos)}
        </Text>

        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
          {pagas.length} de {parcelas.length} parcelas pagas
        </Text>

        {faltaPagar > 0 && (
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.divida }}>
            Falta {formatarBRL(faltaPagar)}
          </Text>
        )}
      </Cartao>

      <View
        style={{
          backgroundColor: tema.cores.fundo,
          borderRadius: tema.raio.lg,
          overflow: 'hidden',
          ...tema.sombra.card,
        }}>
        {parcelas.map((parcela, indice) => {
          const situacao = situacaoDaParcela(parcela);

          return (
            <View key={parcela.id}>
              {indice > 0 && <Separador />}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tema.espaco.md,
                  padding: tema.espaco.lg,
                }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: tema.fonte.corpo,
                      fontWeight: tema.peso.forte,
                      color: parcela.pagoEm != null ? tema.cores.textoFraco : tema.cores.texto,
                    }}>
                    {parcela.numero}ª · {formatarBRL(parcela.valorCentavos)}
                  </Text>
                  <Text
                    style={{
                      fontSize: tema.fonte.pequeno,
                      color:
                        situacao === 'vencida'
                          ? tema.cores.divida
                          : situacao === 'paga'
                            ? tema.cores.pago
                            : tema.cores.textoSecundario,
                    }}>
                    {descreverSituacao(parcela, situacao)}
                  </Text>
                </View>

                {parcela.pagoEm == null && acordo.status === 'ativo' && (
                  <Botao titulo="Recebi" aoTocar={() => confirmarQuitacao(parcela)} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {acordo.status === 'ativo' && (
        <Botao titulo="Cancelar acordo" variante="texto" aoTocar={confirmarQuebra} />
      )}
    </ScrollView>
  );
}

type Situacao = 'paga' | 'vencida' | 'aberta';

function situacaoDaParcela(parcela: AcordoParcela): Situacao {
  if (parcela.pagoEm != null) return 'paga';
  // Vencimento e dia civil, entao a comparacao de texto ISO ja basta.
  return parcela.vencimento < hoje() ? 'vencida' : 'aberta';
}

function descreverSituacao(parcela: AcordoParcela, situacao: Situacao): string {
  if (situacao === 'paga') return `Paga em ${formatarDataBR(parcela.pagoEm!)}`;
  if (situacao === 'vencida') {
    const dias = diasEntre(parcela.vencimento, hoje());
    return `Venceu há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  return `Vence em ${formatarDataBR(parcela.vencimento)}`;
}

function rotuloStatus(status: Acordo['status']): string {
  if (status === 'cumprido') return 'Acordo cumprido';
  if (status === 'quebrado') return 'Acordo cancelado';
  return 'Acordo em andamento';
}
