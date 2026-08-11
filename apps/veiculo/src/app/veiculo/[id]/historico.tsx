import { formatarBRL, formatarDataBR } from '@repo/core';
import {
  consultaAbastecimentos,
  consultaManutencoes,
  excluirAbastecimento,
  excluirManutencao,
  TABELAS_DO_VEICULO,
  useConsultaViva,
  type Abastecimento,
  type Manutencao,
} from '@repo/core/db';
import { Botao, Cartao, Separador, useTema } from '@repo/ui';
import { useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

type EntradaHistorico =
  | { tipo: 'abastecimento'; dado: Abastecimento; data: string }
  | { tipo: 'manutencao'; dado: Manutencao; data: string };

export default function TelaHistorico() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: abastecimentos } = useConsultaViva(
    consultaAbastecimentos(db, id),
    TABELAS_DO_VEICULO,
    [id]
  );

  const { data: manutencoes } = useConsultaViva(
    consultaManutencoes(db, id),
    TABELAS_DO_VEICULO,
    [id]
  );

  // Mescla os dois historicos ordenados por km desc, depois por data
  const entradas: EntradaHistorico[] = [
    ...(abastecimentos ?? []).map((a: Abastecimento) => ({
      tipo: 'abastecimento' as const,
      dado: a,
      data: a.data,
    })),
    ...(manutencoes ?? []).map((m: Manutencao) => ({
      tipo: 'manutencao' as const,
      dado: m,
      data: m.data,
    })),
  ].sort((a, b) => {
    const kmA = a.tipo === 'abastecimento' ? a.dado.km : a.dado.km;
    const kmB = b.tipo === 'abastecimento' ? b.dado.km : b.dado.km;
    if (kmB !== kmA) return kmB - kmA;
    return b.data.localeCompare(a.data);
  });

  function confirmarExcluir(entrada: EntradaHistorico) {
    Alert.alert(t('historico.confirmarExcluir'), t('historico.confirmarExcluirDetalhe'), [
      { text: t('historico.cancelar'), style: 'cancel' },
      {
        text: t('historico.excluir'),
        style: 'destructive',
        onPress: async () => {
          if (entrada.tipo === 'abastecimento') {
            await excluirAbastecimento(db, entrada.dado.id);
          } else {
            await excluirManutencao(db, entrada.dado.id);
          }
        },
      },
    ]);
  }

  if (entradas.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tema.espaco.xl,
          gap: tema.espaco.md,
        }}>
        <Text style={{ fontSize: tema.fonte.subtitulo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
          {t('historico.semRegistros')}
        </Text>
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, textAlign: 'center' }}>
          {t('historico.semRegistrosDetalhe')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.md }}>
      <Cartao estilo={{ gap: 0 }}>
        {entradas.map((entrada, indice) => (
          <View key={`${entrada.tipo}-${entrada.dado.id}`}>
            {indice > 0 && <Separador />}
            {entrada.tipo === 'abastecimento' ? (
              <LinhaAbastecimento
                abastecimento={entrada.dado}
                aoExcluir={() => confirmarExcluir(entrada)}
              />
            ) : (
              <LinhaManutencao
                manutencao={entrada.dado}
                aoExcluir={() => confirmarExcluir(entrada)}
              />
            )}
          </View>
        ))}
      </Cartao>
    </ScrollView>
  );
}

function LinhaAbastecimento({
  abastecimento,
  aoExcluir,
}: {
  abastecimento: Abastecimento;
  aoExcluir: () => void;
}) {
  const tema = useTema();
  const { t } = useTranslation();

  return (
    <View style={{ padding: tema.espaco.md, gap: tema.espaco.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espaco.xs }}>
            <Text style={{ fontSize: tema.fonte.pequeno, fontWeight: tema.peso.forte, color: tema.cores.primaria }}>
              ⛽ {t('historico.abastecimento')}
            </Text>
            {!abastecimento.tanqueCheio && (
              <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
                · {t('historico.tanqueParcial')}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
            {formatarDataBR(abastecimento.data)} · {abastecimento.km.toLocaleString('pt-BR')} km
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
            {(abastecimento.litrosMilesimos / 1000).toFixed(3).replace('.', ',')} L · {formatarBRL(abastecimento.valorTotalCentavos)}
            {abastecimento.posto ? ` · ${abastecimento.posto}` : ''}
          </Text>
          {abastecimento.observacao && (
            <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
              {abastecimento.observacao}
            </Text>
          )}
        </View>
        <Botao titulo={t('historico.excluir')} variante="texto" aoTocar={aoExcluir} />
      </View>
    </View>
  );
}

function LinhaManutencao({
  manutencao,
  aoExcluir,
}: {
  manutencao: Manutencao;
  aoExcluir: () => void;
}) {
  const tema = useTema();
  const { t } = useTranslation();

  return (
    <View style={{ padding: tema.espaco.md, gap: tema.espaco.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: tema.fonte.pequeno, fontWeight: tema.peso.forte, color: tema.cores.alerta }}>
            🔧 {t('historico.manutencao')}
          </Text>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
            {formatarDataBR(manutencao.data)} · {manutencao.tipo}
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
            {manutencao.km.toLocaleString('pt-BR')} km · {formatarBRL(manutencao.valorCentavos)}
            {manutencao.oficina ? ` · ${manutencao.oficina}` : ''}
          </Text>
          {manutencao.observacao && (
            <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
              {manutencao.observacao}
            </Text>
          )}
        </View>
        <Botao titulo={t('historico.excluir')} variante="texto" aoTocar={aoExcluir} />
      </View>
    </View>
  );
}
