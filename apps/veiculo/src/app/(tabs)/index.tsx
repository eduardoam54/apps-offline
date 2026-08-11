import {
  hoje,
  podeCadastrarVeiculo,
} from '@repo/core';
import {
  consultaLembretes,
  consultaVeiculos,
  statusDoLembrete,
  TABELAS_DO_VEICULO,
  useConsultaViva,
  type Lembrete,
  type Veiculo,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { useLicenca } from '@/licenca';

export default function TelaVeiculos() {
  const tema = useTema();
  const { t } = useTranslation();
  const plano = useLicenca((e) => e.plano);

  const { data: veiculos } = useConsultaViva(
    consultaVeiculos(db),
    ['veiculo'],
    []
  );

  const lista = veiculos ?? [];
  const podeAdicionar = podeCadastrarVeiculo(plano, lista.length);

  function aoTocarNovo() {
    if (!podeAdicionar) {
      router.push('/plano');
      return;
    }
    router.push('/veiculo/novo');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.md }}>
      {!podeAdicionar && (
        <Cartao estilo={{ backgroundColor: tema.cores.alertaFundo, gap: tema.espaco.xs }}>
          <Text
            style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.alerta }}>
            {t('listaVeiculos.limiteAtingido')}
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
            {t('listaVeiculos.limiteDetalhe')}
          </Text>
        </Cartao>
      )}

      {lista.length === 0 ? (
        <EstadoVazio
          titulo={t('listaVeiculos.vazio')}
          texto={t('listaVeiculos.vazioDetalhe')}
          icone="directions-car"
        />
      ) : (
        lista.map((v) => (
          <CartaoVeiculo key={v.id} veiculo={v} />
        ))
      )}

      <Botao titulo={t('listaVeiculos.botaoNovo')} principal aoTocar={aoTocarNovo} />
    </ScrollView>
  );
}

function CartaoVeiculo({ veiculo }: { veiculo: Veiculo }) {
  const tema = useTema();
  const { t } = useTranslation();

  const { data: lembretes } = useConsultaViva(
    consultaLembretes(db, veiculo.id),
    TABELAS_DO_VEICULO,
    [veiculo.id]
  );

  const dataHoje = hoje();
  const alertas = (lembretes ?? []).filter((l: Lembrete) => {
    const status = statusDoLembrete(l, veiculo.kmAtual, dataHoje);
    return status === 'vencido' || status === 'proximo';
  });

  return (
    <Pressable
      onPress={() => router.push(`/veiculo/${veiculo.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? tema.cores.borda : tema.cores.superficieElevada,
        borderRadius: tema.raio.lg,
        padding: tema.espaco.lg,
        gap: tema.espaco.sm,
        ...tema.sombra.card,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontSize: tema.fonte.subtitulo,
              fontWeight: tema.peso.forte,
              color: tema.cores.texto,
            }}>
            {veiculo.apelido}
          </Text>
          {(veiculo.marcaModelo || veiculo.placa) && (
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
              {[veiculo.marcaModelo, veiculo.placa].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        {alertas.length > 0 && (
          <View
            style={{
              backgroundColor: tema.cores.alertaFundo,
              borderRadius: tema.raio.pilula,
              paddingHorizontal: tema.espaco.sm,
              paddingVertical: 2,
            }}>
            <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.alerta, fontWeight: tema.peso.forte }}>
              {alertas.length}{' '}
              {alertas.length === 1
                ? t('listaVeiculos.lembretePendente')
                : t('listaVeiculos.lembretesPendentes')}
            </Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoFraco }}>
        {veiculo.kmAtual.toLocaleString('pt-BR')} {t('listaVeiculos.kmAtual')}
      </Text>
    </Pressable>
  );
}
