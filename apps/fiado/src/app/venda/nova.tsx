import { formatarBRL, formatarDataBR, hoje, type Centavos } from '@repo/core';
import { consultaClientesComSaldo, lancarVenda, type ClienteComSaldo } from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, Cartao, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

/**
 * Lancar fiado.
 *
 * A promessa do app e registrar uma divida em menos de dez segundos atras do
 * balcao. Por isso o campo de valor abre com o teclado numerico ja aberto e e a
 * unica coisa obrigatoria da tela — descricao e data sao opcionais e ficam
 * abaixo, fora do caminho.
 */
export default function NovaVenda() {
  const tema = useTema();
  const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

  const [valor, setValor] = useState<Centavos>(0);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data: clientes } = useLiveQuery(consultaClientesComSaldo(db), []);
  const cliente = ((clientes ?? []) as ClienteComSaldo[]).find((c) => c.id === clienteId);

  const saldoAtual = cliente?.saldoCentavos ?? 0;
  const limite = cliente?.limiteCreditoCentavos ?? null;
  const saldoFuturo = saldoAtual + valor;
  const vaiPassarDoLimite = limite != null && valor > 0 && saldoFuturo > limite;

  async function salvar() {
    if (valor <= 0) {
      setErro('Digite um valor maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await lancarVenda(db, { clienteId, valorCentavos: valor, descricao, data: hoje() });
      // Confirmacao tatil: no balcao o comerciante nem sempre olha a tela depois
      // de tocar em salvar.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (falha) {
      Alert.alert('Não deu para lançar', String(falha));
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      {cliente != null && (
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          {cliente.nome} · deve {formatarBRL(saldoAtual)}
        </Text>
      )}

      <CampoValor
        rotulo="Valor do fiado"
        valor={valor}
        aoMudar={(v) => {
          setValor(v);
          if (erro != null) setErro(null);
        }}
        erro={erro}
        autoFoco
      />

      {vaiPassarDoLimite && (
        <View
          style={{
            backgroundColor: tema.cores.alertaFundo,
            borderRadius: tema.raio.md,
            padding: tema.espaco.lg,
            gap: tema.espaco.xs,
          }}>
          <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.alerta }}>
            Vai passar do limite
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta }}>
            O saldo vai para {formatarBRL(saldoFuturo)}, acima do limite de {formatarBRL(limite!)}.
            Você pode lançar assim mesmo.
          </Text>
        </View>
      )}

      <CampoTexto
        rotulo="O que levou (opcional)"
        valor={descricao}
        aoMudar={setDescricao}
        espacoReservado="Ex.: pão, leite e café"
        maiusculaInicial="sentences"
      />

      <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
          Data: {formatarDataBR(hoje())}
        </Text>
        {valor > 0 && (
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto, fontWeight: tema.peso.forte }}>
            Novo saldo: {formatarBRL(saldoFuturo)}
          </Text>
        )}
      </Cartao>

      <Botao titulo="Lançar fiado" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
