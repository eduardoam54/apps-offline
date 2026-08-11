import { hoje } from '@repo/core';
import { criarLembrete } from '@repo/core/db';
import type { TipoLembrete } from '@repo/core/db';
import { Botao, CampoTexto, Cartao, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';

export default function TelaNovoLembrete() {
  const tema = useTema();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tipo, setTipo] = useState<TipoLembrete>('km');
  const [descricao, setDescricao] = useState('');
  const [kmAlvo, setKmAlvo] = useState('');
  const [dataAlvo, setDataAlvo] = useState(hoje());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!descricao.trim()) {
      setErro(t('novoLembrete.erroDescricao'));
      return;
    }
    if (tipo === 'km') {
      const kmNum = parseInt(kmAlvo.replace(/\D/g, '') || '0', 10);
      if (!kmAlvo.trim() || kmNum <= 0) {
        setErro(t('novoLembrete.erroKmAlvo'));
        return;
      }
    }
    if (tipo === 'data' && !dataAlvo.trim()) {
      setErro(t('novoLembrete.erroDataAlvo'));
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      const kmNum = tipo === 'km' ? parseInt(kmAlvo.replace(/\D/g, '') || '0', 10) : null;
      await criarLembrete(db, id, {
        tipo,
        descricao: descricao.trim(),
        kmAlvo: tipo === 'km' ? kmNum : null,
        dataAlvo: tipo === 'data' ? dataAlvo : null,
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
      {/* Seletor de tipo */}
      <View style={{ gap: tema.espaco.xs }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.medio,
            color: tema.cores.textoSecundario,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          {t('novoLembrete.tipo')}
        </Text>
        <View style={{ flexDirection: 'row', gap: tema.espaco.sm }}>
          {(['km', 'data'] as TipoLembrete[]).map((opcao) => (
            <Pressable
              key={opcao}
              onPress={() => setTipo(opcao)}
              style={{
                flex: 1,
                paddingVertical: tema.espaco.sm,
                paddingHorizontal: tema.espaco.md,
                borderRadius: tema.raio.md,
                alignItems: 'center',
                backgroundColor: tipo === opcao ? tema.cores.primaria : tema.cores.superficieAfundada,
              }}>
              <Text
                style={{
                  fontSize: tema.fonte.corpo,
                  fontWeight: tema.peso.forte,
                  color: tipo === opcao ? tema.cores.textoInverso : tema.cores.texto,
                }}>
                {opcao === 'km' ? t('novoLembrete.tipoPorKm') : t('novoLembrete.tipoPorData')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <CampoTexto
        rotulo={t('novoLembrete.descricao')}
        valor={descricao}
        aoMudar={setDescricao}
        espacoReservado={t('novoLembrete.descricaoPlaceholder')}
      />

      {tipo === 'km' ? (
        <CampoTexto
          rotulo={t('novoLembrete.kmAlvo')}
          valor={kmAlvo}
          aoMudar={setKmAlvo}
          espacoReservado={t('novoLembrete.kmAlvoPlaceholder')}
          tipoTeclado="numeric"
          maiusculaInicial="none"
        />
      ) : (
        <CampoTexto
          rotulo={t('novoLembrete.dataAlvo')}
          valor={dataAlvo}
          aoMudar={setDataAlvo}
          espacoReservado="AAAA-MM-DD"
          maiusculaInicial="none"
        />
      )}

      {erro && (
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
      )}

      <Botao titulo={t('novoLembrete.salvar')} principal carregando={salvando} aoTocar={salvar} />
      <Botao
        titulo={t('novoLembrete.cancelar')}
        variante="texto"
        aoTocar={() => router.back()}
      />
    </ScrollView>
  );
}
