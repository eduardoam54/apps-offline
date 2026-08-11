import { hoje } from '@repo/core';
import { registrarManutencao } from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaNovaManutencao() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState(hoje());
  const [km, setKm] = useState('');
  const [tipo, setTipo] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [oficina, setOficina] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!tipo.trim()) {
      setErro(t('novaManutencao.erroTipo'));
      return;
    }
    if (valorCentavos <= 0) {
      setErro(t('novaManutencao.erroValor'));
      return;
    }

    const kmNum = parseInt(km.replace(/\D/g, '') || '0', 10);
    setErro(null);
    setSalvando(true);
    try {
      await registrarManutencao(db, id, {
        data,
        km: kmNum,
        tipo: tipo.trim(),
        valorCentavos,
        oficina: oficina.trim() || null,
        observacao: observacao.trim() || null,
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
      <CampoValor
        rotulo={t('novaManutencao.valor')}
        valor={valorCentavos}
        aoMudar={setValorCentavos}
        autoFoco
        erro={erro === t('novaManutencao.erroValor') ? erro : null}
      />

      <CampoTexto
        rotulo={t('novaManutencao.tipo')}
        valor={tipo}
        aoMudar={setTipo}
        espacoReservado={t('novaManutencao.tipoPlaceholder')}
      />

      <CampoTexto
        rotulo={t('novaManutencao.km')}
        valor={km}
        aoMudar={setKm}
        espacoReservado={t('novaManutencao.kmPlaceholder')}
        tipoTeclado="numeric"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo={t('novaManutencao.data')}
        valor={data}
        aoMudar={setData}
        espacoReservado="AAAA-MM-DD"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo={t('novaManutencao.oficina')}
        valor={oficina}
        aoMudar={setOficina}
        espacoReservado={t('novaManutencao.oficinaPlaceholder')}
      />

      <CampoTexto
        rotulo={t('novaManutencao.observacao')}
        valor={observacao}
        aoMudar={setObservacao}
        espacoReservado={t('novaManutencao.observacaoPlaceholder')}
      />

      {erro && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
      )}

      <Botao
        titulo={t('novaManutencao.salvar')}
        principal
        carregando={salvando}
        aoTocar={salvar}
      />
      <Botao
        titulo={t('novaManutencao.cancelar')}
        variante="texto"
        aoTocar={() => router.back()}
      />
    </ScrollView>
  );
}
