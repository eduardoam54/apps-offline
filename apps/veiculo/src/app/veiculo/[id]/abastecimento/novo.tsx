import { hoje, parseValorBR } from '@repo/core';
import { registrarAbastecimento } from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, Cartao, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaNovoAbastecimento() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState(hoje());
  const [km, setKm] = useState('');
  const [litros, setLitros] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [tanqueCheio, setTanqueCheio] = useState(true);
  const [posto, setPosto] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const kmNum = parseInt(km.replace(/\D/g, '') || '0', 10);
    if (!km.trim() || kmNum <= 0) {
      setErro(t('novoAbastecimento.erroKm'));
      return;
    }

    // Litros: aceita "35.5" ou "35,5" ou "35500" (milésimos)
    const litrosTexto = litros.replace(',', '.').trim();
    const litrosNum = parseFloat(litrosTexto);
    if (!litros.trim() || isNaN(litrosNum) || litrosNum <= 0) {
      setErro(t('novoAbastecimento.erroLitros'));
      return;
    }
    const litrosMilesimos = Math.round(litrosNum * 1000);

    if (valorCentavos <= 0) {
      setErro(t('novoAbastecimento.erroValor'));
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      await registrarAbastecimento(db, id, {
        data,
        km: kmNum,
        litrosMilesimos,
        valorTotalCentavos: valorCentavos,
        tanqueCheio,
        posto: posto.trim() || null,
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
        rotulo={t('novoAbastecimento.valorTotal')}
        valor={valorCentavos}
        aoMudar={setValorCentavos}
        autoFoco
        erro={erro === t('novoAbastecimento.erroValor') ? erro : null}
      />

      <CampoTexto
        rotulo={t('novoAbastecimento.km')}
        valor={km}
        aoMudar={setKm}
        espacoReservado={t('novoAbastecimento.kmPlaceholder')}
        tipoTeclado="numeric"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo={t('novoAbastecimento.litros')}
        valor={litros}
        aoMudar={setLitros}
        espacoReservado={t('novoAbastecimento.litrosPlaceholder')}
        tipoTeclado="decimal-pad"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo={t('novoAbastecimento.data')}
        valor={data}
        aoMudar={setData}
        espacoReservado="AAAA-MM-DD"
        maiusculaInicial="none"
      />

      {/* Tanque cheio toggle */}
      <Cartao estilo={{ flexDirection: 'row', alignItems: 'center', gap: tema.espaco.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
            {t('novoAbastecimento.tanqueCheio')}
          </Text>
          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, lineHeight: 18 }}>
            {t('novoAbastecimento.tanqueCheioDetalhe')}
          </Text>
        </View>
        <Switch
          value={tanqueCheio}
          onValueChange={setTanqueCheio}
          trackColor={{ true: tema.cores.primaria, false: tema.cores.bordaForte }}
        />
      </Cartao>

      <CampoTexto
        rotulo={t('novoAbastecimento.posto')}
        valor={posto}
        aoMudar={setPosto}
        espacoReservado={t('novoAbastecimento.postoPlaceholder')}
      />

      <CampoTexto
        rotulo={t('novoAbastecimento.observacao')}
        valor={observacao}
        aoMudar={setObservacao}
        espacoReservado={t('novoAbastecimento.observacaoPlaceholder')}
      />

      {erro && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
      )}

      <Botao
        titulo={t('novoAbastecimento.salvar')}
        principal
        carregando={salvando}
        aoTocar={salvar}
      />
      <Botao
        titulo={t('novoAbastecimento.cancelar')}
        variante="texto"
        aoTocar={() => router.back()}
      />
    </ScrollView>
  );
}
