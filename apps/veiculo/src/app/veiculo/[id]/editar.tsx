import { Botao, CampoTexto, useTema } from '@repo/ui';
import { consultaVeiculos, editarVeiculo, useConsultaViva, type Veiculo } from '@repo/core/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaEditarVeiculo() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: todosVeiculos } = useConsultaViva(consultaVeiculos(db), ['veiculo'], []);
  const veiculo = (todosVeiculos ?? []).find((v: Veiculo) => v.id === id);

  const [apelido, setApelido] = useState('');
  const [placa, setPlaca] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!veiculo) return;
    setApelido(veiculo.apelido);
    setPlaca(veiculo.placa ?? '');
    setMarcaModelo(veiculo.marcaModelo ?? '');
    setKmAtual(String(veiculo.kmAtual));
  }, [veiculo?.id]);

  async function salvar() {
    const apelidoTrimado = apelido.trim();
    if (!apelidoTrimado) {
      Alert.alert('', t('novoVeiculo.erroApelido'));
      return;
    }
    setSalvando(true);
    try {
      const km = parseInt(kmAtual.replace(/\D/g, '') || '0', 10);
      await editarVeiculo(db, id, {
        apelido: apelidoTrimado,
        placa: placa.trim() || null,
        marcaModelo: marcaModelo.trim() || null,
        kmAtual: km,
      });
      router.back();
    } catch (falha) {
      Alert.alert('Erro', String(falha));
    } finally {
      setSalvando(false);
    }
  }

  if (!veiculo) return null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <CampoTexto
        rotulo={t('novoVeiculo.apelido')}
        valor={apelido}
        aoMudar={setApelido}
        espacoReservado={t('novoVeiculo.apelidoPlaceholder')}
      />

      <CampoTexto
        rotulo={t('novoVeiculo.placa')}
        valor={placa}
        aoMudar={setPlaca}
        espacoReservado={t('novoVeiculo.placaPlaceholder')}
        maiusculaInicial="characters"
      />

      <CampoTexto
        rotulo={t('novoVeiculo.marcaModelo')}
        valor={marcaModelo}
        aoMudar={setMarcaModelo}
        espacoReservado={t('novoVeiculo.marcaModeloPlaceholder')}
      />

      <CampoTexto
        rotulo={t('novoVeiculo.kmAtual')}
        valor={kmAtual}
        aoMudar={setKmAtual}
        espacoReservado={t('novoVeiculo.kmPlaceholder')}
        tipoTeclado="numeric"
        maiusculaInicial="none"
      />

      <Botao titulo={t('novoVeiculo.salvar')} principal carregando={salvando} aoTocar={salvar} />
      <Botao titulo={t('novoVeiculo.cancelar')} variante="texto" aoTocar={() => router.back()} />
    </ScrollView>
  );
}
