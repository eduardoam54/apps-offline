import {
  formatarBRL,
  formatarDataBR,
  hoje,
} from '@repo/core';
import {
  arquivarVeiculo,
  calcularConsumo,
  concluirLembrete,
  consultaAbastecimentos,
  consultaLembretes,
  consultaManutencoes,
  consultaVeiculos,
  statusDoLembrete,
  TABELAS_DO_VEICULO,
  useConsultaViva,
  type Abastecimento,
  type Lembrete,
  type Manutencao,
  type Veiculo,
} from '@repo/core/db';
import { Botao, Cartao, Separador, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaDetalheVeiculo() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: todosVeiculos } = useConsultaViva(
    consultaVeiculos(db),
    ['veiculo'],
    []
  );
  const veiculo = (todosVeiculos ?? []).find((v: Veiculo) => v.id === id);

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

  const { data: lembretes } = useConsultaViva(
    consultaLembretes(db, id),
    TABELAS_DO_VEICULO,
    [id]
  );

  const abs = abastecimentos ?? [];
  const mans = manutencoes ?? [];
  const lems = lembretes ?? [];
  const dataHoje = hoje();
  const kmAtual = veiculo?.kmAtual ?? 0;

  const consumo = calcularConsumo(abs);

  // Custo por km: soma de tudo / km rodado (so quando temos dados de consumo)
  const custoTotal = [
    ...abs.map((a: Abastecimento) => a.valorTotalCentavos),
    ...mans.map((m: Manutencao) => m.valorCentavos),
  ].reduce((s, v) => s + v, 0);

  const custoKm =
    consumo && consumo.distancia > 0
      ? Math.round(custoTotal / consumo.distancia)
      : null;

  async function arquivar() {
    Alert.alert(
      t('detalheVeiculo.confirmarArquivar'),
      t('detalheVeiculo.confirmarArquivarDetalhe'),
      [
        { text: t('detalheVeiculo.cancelar'), style: 'cancel' },
        {
          text: t('detalheVeiculo.arquivar'),
          style: 'destructive',
          onPress: async () => {
            await arquivarVeiculo(db, id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
      {/* Métricas */}
      <View style={{ flexDirection: 'row', gap: tema.espaco.md }}>
        <MetricaCard
          label={t('detalheVeiculo.consumoMedio')}
          valor={
            consumo
              ? `${consumo.kmPorLitro.toFixed(1)} ${t('detalheVeiculo.kmPorLitro')}`
              : t('detalheVeiculo.semConsumo')
          }
        />
        <MetricaCard
          label={t('detalheVeiculo.custoKm')}
          valor={
            custoKm != null
              ? `${formatarBRL(custoKm)}/km`
              : t('detalheVeiculo.semCustoKm')
          }
        />
      </View>

      {/* Lembretes ativos */}
      {lems.length > 0 && (
        <View style={{ gap: tema.espaco.md }}>
          <Rotulo texto={t('detalheVeiculo.secoesLembretes')} />
          {lems.map((lem: Lembrete) => (
            <LembreteCard
              key={lem.id}
              lembrete={lem}
              kmAtual={kmAtual}
              dataHoje={dataHoje}
              aoConcluir={async () => {
                await concluirLembrete(db, lem.id);
              }}
            />
          ))}
        </View>
      )}

      {/* Ações rápidas */}
      <View style={{ flexDirection: 'row', gap: tema.espaco.md }}>
        <View style={{ flex: 1 }}>
          <Botao
            titulo={t('detalheVeiculo.botaoAbastecimento')}
            principal
            aoTocar={() => router.push(`/veiculo/${id}/abastecimento/novo`)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Botao
            titulo={t('detalheVeiculo.botaoManutencao')}
            variante="secundario"
            aoTocar={() => router.push(`/veiculo/${id}/manutencao/nova`)}
          />
        </View>
      </View>

      <Botao
        titulo={t('detalheVeiculo.botaoLembrete')}
        variante="secundario"
        aoTocar={() => router.push(`/veiculo/${id}/lembrete/novo`)}
      />

      <Botao
        titulo={t('detalheVeiculo.botaoHistorico')}
        variante="secundario"
        aoTocar={() => router.push(`/veiculo/${id}/historico`)}
      />

      {/* Últimos abastecimentos */}
      {abs.length > 0 && (
        <View style={{ gap: tema.espaco.md }}>
          <Rotulo texto={t('detalheVeiculo.abastecimentos')} />
          <Cartao estilo={{ gap: 0 }}>
            {abs.slice(0, 3).map((a: Abastecimento, i: number) => (
              <View key={a.id}>
                {i > 0 && <Separador />}
                <View style={{ padding: tema.espaco.md, gap: 2 }}>
                  <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                    {formatarDataBR(a.data)} · {a.km.toLocaleString('pt-BR')} km
                    {!a.tanqueCheio && (
                      <Text style={{ color: tema.cores.textoFraco }}>{' · parcial'}</Text>
                    )}
                  </Text>
                  <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
                    {(a.litrosMilesimos / 1000).toFixed(3).replace('.', ',')} L · {formatarBRL(a.valorTotalCentavos)}
                    {a.posto ? ` · ${a.posto}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Cartao>
        </View>
      )}

      {/* Últimas manutenções */}
      {mans.length > 0 && (
        <View style={{ gap: tema.espaco.md }}>
          <Rotulo texto={t('detalheVeiculo.manutencoes')} />
          <Cartao estilo={{ gap: 0 }}>
            {mans.slice(0, 3).map((m: Manutencao, i: number) => (
              <View key={m.id}>
                {i > 0 && <Separador />}
                <View style={{ padding: tema.espaco.md, gap: 2 }}>
                  <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                    {formatarDataBR(m.data)} · {m.tipo}
                  </Text>
                  <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
                    {m.km.toLocaleString('pt-BR')} km · {formatarBRL(m.valorCentavos)}
                    {m.oficina ? ` · ${m.oficina}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Cartao>
        </View>
      )}

      {/* Editar / Arquivar */}
      <View style={{ gap: tema.espaco.sm }}>
        <Botao
          titulo={t('detalheVeiculo.botaoEditar')}
          variante="secundario"
          aoTocar={() => router.push(`/veiculo/${id}/editar`)}
        />
        <Botao titulo={t('detalheVeiculo.botaoArquivar')} variante="texto" aoTocar={arquivar} />
      </View>
    </ScrollView>
  );
}

function MetricaCard({ label, valor }: { label: string; valor: string }) {
  const tema = useTema();
  return (
    <Cartao estilo={{ flex: 1, gap: 2, alignItems: 'center', padding: tema.espaco.md }}>
      <Text
        style={{
          fontSize: tema.fonte.micro,
          color: tema.cores.textoFraco,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: tema.fonte.subtitulo,
          fontWeight: tema.peso.forte,
          color: tema.cores.texto,
        }}>
        {valor}
      </Text>
    </Cartao>
  );
}

function LembreteCard({
  lembrete,
  kmAtual,
  dataHoje,
  aoConcluir,
}: {
  lembrete: Lembrete;
  kmAtual: number;
  dataHoje: string;
  aoConcluir: () => Promise<void>;
}) {
  const tema = useTema();
  const { t } = useTranslation();
  const status = statusDoLembrete(lembrete, kmAtual, dataHoje);
  const corStatus = status === 'vencido' ? tema.cores.divida : tema.cores.alerta;
  const textoStatus =
    status === 'vencido' ? t('detalheVeiculo.vencido') : t('detalheVeiculo.proximo');

  const alvo =
    lembrete.tipo === 'km' && lembrete.kmAlvo != null
      ? `${lembrete.kmAlvo.toLocaleString('pt-BR')} km`
      : lembrete.dataAlvo
        ? formatarDataBR(lembrete.dataAlvo)
        : '';

  return (
    <Cartao estilo={{ flexDirection: 'row', alignItems: 'center', gap: tema.espaco.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
          {lembrete.descricao}
        </Text>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
          {alvo}{alvo ? ' · ' : ''}
          <Text style={{ color: corStatus, fontWeight: tema.peso.forte }}>{textoStatus}</Text>
        </Text>
      </View>
      <Pressable
        onPress={aoConcluir}
        accessibilityRole="button"
        accessibilityLabel="Concluir lembrete"
        style={({ pressed }) => ({
          paddingHorizontal: tema.espaco.md,
          paddingVertical: tema.espaco.xs,
          borderRadius: tema.raio.md,
          backgroundColor: pressed ? tema.cores.borda : tema.cores.superficieAfundada,
        })}>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>✓</Text>
      </Pressable>
    </Cartao>
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
