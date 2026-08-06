import { formatarBRL, formatarDataBR, hoje, type Centavos } from '@repo/core';
import {
  buscarAcordoAtivo,
  consultaClientesComSaldo,
  proximaParcela,
  quitarParcela,
  receberPagamento,
  type AcordoParcela,
  type ClienteComSaldo,
  type FormaPagamento,
} from '@repo/core/db';
import { Botao, CampoValor, Cartao, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

const FORMAS: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'outro', rotulo: 'Outro' },
];

export default function NovoPagamento() {
  const tema = useTema();
  const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

  const { data: clientes } = useLiveQuery(consultaClientesComSaldo(db), []);
  const cliente = ((clientes ?? []) as ClienteComSaldo[]).find((c) => c.id === clienteId);
  const saldo = cliente?.saldoCentavos ?? 0;

  const [valor, setValor] = useState<Centavos>(0);
  const [forma, setForma] = useState<FormaPagamento>('dinheiro');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const [parcela, setParcela] = useState<AcordoParcela | null>(null);

  // Havendo acordo ativo, a proxima parcela e o caminho esperado de pagamento.
  // Quitar por ela mantem o acordo em dia; um pagamento solto abateria o saldo
  // mas deixaria a parcela em aberto, e o acordo pareceria atrasado sem estar.
  useEffect(() => {
    let ativo = true;
    buscarAcordoAtivo(db, clienteId).then(async (acordo) => {
      if (!ativo || acordo == null) return;
      const proxima = await proximaParcela(db, acordo.id);
      if (ativo) setParcela(proxima);
    });
    return () => {
      ativo = false;
    };
  }, [clienteId]);

  async function quitarAParcela() {
    if (parcela == null) return;
    setSalvando(true);
    try {
      await quitarParcela(db, parcela.id, { forma });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (falha) {
      Alert.alert('Não deu para registrar', String(falha));
      setSalvando(false);
    }
  }

  // Quitar tudo e de longe o caso mais comum, entao o campo ja abre com o valor
  // total da divida. Preenche uma vez so — depois disso o comerciante manda.
  useEffect(() => {
    if (!preenchido && saldo > 0) {
      setValor(saldo);
      setPreenchido(true);
    }
  }, [saldo, preenchido]);

  const sobra = saldo - valor;

  async function salvar() {
    if (valor <= 0) {
      setErro('Digite um valor maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await receberPagamento(db, { clienteId, valorCentavos: valor, forma, data: hoje() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (falha) {
      Alert.alert('Não deu para registrar', String(falha));
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      {cliente != null && (
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          {cliente.nome} · deve {formatarBRL(saldo)}
        </Text>
      )}

      {parcela != null && (
        <Cartao estilo={{ gap: tema.espaco.md, borderLeftWidth: 4, borderLeftColor: tema.cores.primaria }}>
          <View style={{ gap: tema.espaco.xs }}>
            <Text
              style={{
                fontSize: tema.fonte.pequeno,
                color: tema.cores.textoSecundario,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: tema.peso.medio,
              }}>
              Próxima parcela do acordo
            </Text>
            <Text
              style={{
                fontSize: tema.fonte.subtitulo,
                fontWeight: tema.peso.destaque,
                color: tema.cores.texto,
              }}>
              {parcela.numero}ª · {formatarBRL(parcela.valorCentavos)}
            </Text>
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoFraco }}>
              Vence em {formatarDataBR(parcela.vencimento)}
            </Text>
          </View>

          <Botao titulo="Recebi esta parcela" carregando={salvando} aoTocar={quitarAParcela} />
        </Cartao>
      )}

      <CampoValor
        rotulo={parcela != null ? 'Ou outro valor' : 'Valor recebido'}
        valor={valor}
        aoMudar={(v) => {
          setValor(v);
          if (erro != null) setErro(null);
        }}
        erro={erro}
        autoFoco={parcela == null}
      />

      {valor !== saldo && saldo > 0 && (
        <Botao titulo={`Quitar tudo (${formatarBRL(saldo)})`} variante="texto" aoTocar={() => setValor(saldo)} />
      )}

      <View style={{ gap: tema.espaco.sm }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.medio,
            color: tema.cores.textoSecundario,
          }}>
          Forma de pagamento
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espaco.sm }}>
          {FORMAS.map((opcao) => {
            const ativa = forma === opcao.valor;
            return (
              <Pressable
                key={opcao.valor}
                onPress={() => setForma(opcao.valor)}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativa }}
                style={{
                  minHeight: tema.toque.minimo,
                  paddingHorizontal: tema.espaco.lg,
                  justifyContent: 'center',
                  borderRadius: tema.raio.pilula,
                  borderWidth: 1,
                  borderColor: ativa ? tema.cores.primaria : tema.cores.bordaForte,
                  backgroundColor: ativa ? tema.cores.primariaClara : tema.cores.fundo,
                }}>
                <Text
                  style={{
                    fontSize: tema.fonte.corpo,
                    fontWeight: ativa ? tema.peso.forte : tema.peso.normal,
                    color: ativa ? tema.cores.primariaEscura : tema.cores.texto,
                  }}>
                  {opcao.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {valor > 0 && (
        <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto, fontWeight: tema.peso.forte }}>
            {sobra > 0
              ? `Ainda vai dever ${formatarBRL(sobra)}`
              : sobra === 0
                ? 'Fica quite'
                : `Fica com ${formatarBRL(Math.abs(sobra))} de crédito`}
          </Text>
        </Cartao>
      )}

      <Botao titulo="Registrar pagamento" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
