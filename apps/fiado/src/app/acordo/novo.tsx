import {
  adicionarDias,
  dividirParcelas,
  formatarBRL,
  formatarDataBR,
  hoje,
  type Centavos,
} from '@repo/core';
import {
  buscarAcordoAtivo,
  calcularVencimento,
  consultaClientesComSaldo,
  criarAcordo,
  type ClienteComSaldo,
  type Periodicidade,
} from '@repo/core/db';
import { Botao, CampoValor, Cartao, useTema } from '@repo/ui';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

const OPCOES_PARCELAS = [2, 3, 4, 6, 10, 12];
const OPCOES_PRIMEIRO_VENCIMENTO = [
  { dias: 7, rotulo: 'Em 7 dias' },
  { dias: 15, rotulo: 'Em 15 dias' },
  { dias: 30, rotulo: 'Em 30 dias' },
];
const OPCOES_PERIODICIDADE: { valor: Periodicidade; rotulo: string }[] = [
  { valor: 'mensal', rotulo: 'Mensal' },
  { valor: 'quinzenal', rotulo: 'Quinzenal' },
  { valor: 'semanal', rotulo: 'Semanal' },
];

/**
 * Novo acordo de parcelamento.
 *
 * A tela existe para transformar uma divida que travou numa combinacao possivel.
 * Por isso a pre-visualizacao das parcelas e o centro dela: o comerciante mostra
 * a lista para o cliente na hora e os dois combinam olhando o mesmo numero.
 *
 * O acordo NAO cria divida nova — ele reorganiza a que ja existe. O saldo do
 * cliente nao muda ao criar.
 */
export default function NovoAcordo() {
  const tema = useTema();
  const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

  const { data: clientes } = useLiveQuery(consultaClientesComSaldo(db), []);
  const cliente = ((clientes ?? []) as ClienteComSaldo[]).find((c) => c.id === clienteId);
  const saldo = cliente?.saldoCentavos ?? 0;

  const [valor, setValor] = useState<Centavos>(0);
  const [numParcelas, setNumParcelas] = useState(3);
  const [diasAteVencer, setDiasAteVencer] = useState(30);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('mensal');
  const [preenchido, setPreenchido] = useState(false);
  const [temAcordoAtivo, setTemAcordoAtivo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!preenchido && saldo > 0) {
      setValor(saldo);
      setPreenchido(true);
    }
  }, [saldo, preenchido]);

  useEffect(() => {
    buscarAcordoAtivo(db, clienteId).then((ativo) => setTemAcordoAtivo(ativo != null));
  }, [clienteId]);

  const primeiroVencimento = useMemo(() => adicionarDias(hoje(), diasAteVencer), [diasAteVencer]);

  const previa = useMemo(() => {
    if (valor <= 0) return [];
    return dividirParcelas(valor, numParcelas).map((v, indice) => ({
      numero: indice + 1,
      valorCentavos: v,
      vencimento: calcularVencimento(primeiroVencimento, indice, periodicidade),
    }));
  }, [valor, numParcelas, primeiroVencimento, periodicidade]);

  async function salvar() {
    if (valor <= 0) {
      Alert.alert('Valor inválido', 'Digite quanto será parcelado.');
      return;
    }

    setSalvando(true);
    try {
      await criarAcordo(db, {
        clienteId,
        valorTotalCentavos: valor,
        numParcelas,
        primeiroVencimento,
        periodicidade,
      });
      router.back();
    } catch (falha) {
      Alert.alert('Não deu para criar o acordo', String(falha));
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

      {temAcordoAtivo && (
        <View
          style={{
            backgroundColor: tema.cores.alertaFundo,
            borderRadius: tema.raio.md,
            padding: tema.espaco.lg,
          }}>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta }}>
            Este cliente já tem um acordo em andamento. Criar outro não cancela o
            anterior.
          </Text>
        </View>
      )}

      <CampoValor rotulo="Valor a parcelar" valor={valor} aoMudar={setValor} />

      <View style={{ gap: tema.espaco.sm }}>
        <Rotulo texto="Em quantas vezes" />
        <Chips
          opcoes={OPCOES_PARCELAS.map((n) => ({ chave: String(n), rotulo: `${n}x` }))}
          selecionado={String(numParcelas)}
          aoSelecionar={(chave) => setNumParcelas(Number(chave))}
        />
      </View>

      <View style={{ gap: tema.espaco.sm }}>
        <Rotulo texto="Primeiro vencimento" />
        <Chips
          opcoes={OPCOES_PRIMEIRO_VENCIMENTO.map((o) => ({
            chave: String(o.dias),
            rotulo: o.rotulo,
          }))}
          selecionado={String(diasAteVencer)}
          aoSelecionar={(chave) => setDiasAteVencer(Number(chave))}
        />
        <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
          Vence em {formatarDataBR(primeiroVencimento)}
        </Text>
      </View>

      <View style={{ gap: tema.espaco.sm }}>
        <Rotulo texto="A cada quanto tempo" />
        <Chips
          opcoes={OPCOES_PERIODICIDADE.map((o) => ({ chave: o.valor, rotulo: o.rotulo }))}
          selecionado={periodicidade}
          aoSelecionar={(chave) => setPeriodicidade(chave as Periodicidade)}
        />
      </View>

      {previa.length > 0 && (
        <Cartao estilo={{ gap: tema.espaco.md }}>
          <Rotulo texto="Como vai ficar" />
          {previa.map((parcela) => (
            <View
              key={parcela.numero}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
                {parcela.numero}ª · {formatarDataBR(parcela.vencimento)}
              </Text>
              <Text
                style={{
                  fontSize: tema.fonte.corpo,
                  fontWeight: tema.peso.forte,
                  color: tema.cores.texto,
                }}>
                {formatarBRL(parcela.valorCentavos)}
              </Text>
            </View>
          ))}

          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
            Parcelar não muda o quanto o cliente deve — só organiza como ele vai pagar.
          </Text>
        </Cartao>
      )}

      <Botao titulo="Criar acordo" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}

function Rotulo({ texto }: { texto: string }) {
  const tema = useTema();
  return (
    <Text
      style={{
        fontSize: tema.fonte.pequeno,
        fontWeight: tema.peso.medio,
        color: tema.cores.textoSecundario,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
      {texto}
    </Text>
  );
}

function Chips({
  opcoes,
  selecionado,
  aoSelecionar,
}: {
  opcoes: { chave: string; rotulo: string }[];
  selecionado: string;
  aoSelecionar: (chave: string) => void;
}) {
  const tema = useTema();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espaco.sm }}>
      {opcoes.map((opcao) => {
        const ativa = opcao.chave === selecionado;
        return (
          <Pressable
            key={opcao.chave}
            onPress={() => aoSelecionar(opcao.chave)}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativa }}
            style={{
              minHeight: tema.toque.minimo,
              justifyContent: 'center',
              paddingHorizontal: tema.espaco.lg,
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
  );
}
