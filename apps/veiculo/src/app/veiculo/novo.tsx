import { Botao, CampoTexto, useTema } from '@repo/ui';
import { criarVeiculo } from '@repo/core/db';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaNovoVeiculo() {
  const tema = useTema();
  const { t } = useTranslation();

  const [apelido, setApelido] = useState('');
  const [placa, setPlaca] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroApelido, setErroApelido] = useState<string | null>(null);

  async function salvar() {
    const apelidoTrimado = apelido.trim();
    if (!apelidoTrimado) {
      setErroApelido(t('novoVeiculo.erroApelido'));
      return;
    }
    setErroApelido(null);
    setSalvando(true);

    try {
      const km = parseInt(kmAtual.replace(/\D/g, '') || '0', 10);
      await criarVeiculo(db, {
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

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <CampoTexto
        rotulo={t('novoVeiculo.apelido')}
        valor={apelido}
        aoMudar={(texto) => {
          setApelido(texto);
          if (erroApelido) setErroApelido(null);
        }}
        espacoReservado={t('novoVeiculo.apelidoPlaceholder')}
      />

      {erroApelido && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida, marginTop: -tema.espaco.sm }}>
          {erroApelido}
        </Text>
      )}

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
