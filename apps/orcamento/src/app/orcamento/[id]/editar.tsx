import {
  formatarBRL,
  formatarQuantidade,
  parseQuantidade,
  parseValorBR,
  somar,
  totalDoItem,
  type Centavos,
} from '@repo/core';
import {
  atualizarOrcamento,
  buscarOrcamento,
  itensDoOrcamento,
  type Orcamento,
} from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, Cartao, useTema } from '@repo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

type ItemRascunho = {
  descricao: string;
  quantidadeMilesimos: number;
  valorUnitarioCentavos: Centavos;
};

export default function EditarOrcamento() {
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [carregado, setCarregado] = useState(false);
  const [itens, setItens] = useState<ItemRascunho[]>([]);
  const [novoProduto, setNovoProduto] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('1');
  const [novoValor, setNovoValor] = useState('');
  const [erroItem, setErroItem] = useState<string | null>(null);
  const [desconto, setDesconto] = useState<Centavos>(0);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const [orc, itensSalvos] = await Promise.all([
        buscarOrcamento(db, id) as Promise<Orcamento | null>,
        itensDoOrcamento(db, id),
      ]);
      if (!ativo) return;

      if (orc != null && orc.status !== 'aberto') {
        Alert.alert('Orçamento fechado', 'Só é possível editar um orçamento em aberto.');
        router.back();
        return;
      }

      setItens(
        itensSalvos.map((i) => ({
          descricao: i.descricao,
          quantidadeMilesimos: i.quantidadeMilesimos,
          valorUnitarioCentavos: i.valorUnitarioCentavos,
        }))
      );
      setDesconto(orc?.descontoCentavos ?? 0);
      setObservacoes(orc?.observacoes ?? '');
      setCarregado(true);
    })();

    return () => {
      ativo = false;
    };
  }, [id]);

  const totalItens = useMemo(
    () =>
      itens.length === 0
        ? 0
        : somar(...itens.map((i) => totalDoItem(i.valorUnitarioCentavos, i.quantidadeMilesimos))),
    [itens]
  );
  const total = Math.max(0, totalItens - desconto);

  function adicionarItem() {
    const nome = novoProduto.trim();
    const quantidade = parseQuantidade(novaQuantidade);
    const unitario = parseValorBR(novoValor);

    if (nome === '') return setErroItem('Digite a descrição do item.');
    if (quantidade == null) return setErroItem('Quantidade inválida.');
    if (unitario == null || unitario <= 0) return setErroItem('Valor inválido.');

    setItens((atuais) => [
      ...atuais,
      { descricao: nome, quantidadeMilesimos: quantidade, valorUnitarioCentavos: unitario },
    ]);
    setNovoProduto('');
    setNovaQuantidade('1');
    setNovoValor('');
    setErroItem(null);
  }

  async function salvar() {
    if (itens.length === 0) {
      setErroItem('Adicione pelo menos um item.');
      return;
    }

    setSalvando(true);
    try {
      await atualizarOrcamento(db, id, { itens, descontoCentavos: desconto, observacoes });
      router.back();
    } catch (falha) {
      Alert.alert('Não deu para salvar', String(falha));
      setSalvando(false);
    }
  }

  if (!carregado) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={tema.cores.primaria} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <Cartao estilo={{ gap: tema.espaco.md }}>
        {itens.map((item, indice) => (
          <View
            key={`${item.descricao}-${indice}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espaco.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                {formatarQuantidade(item.quantidadeMilesimos)} × {item.descricao}
              </Text>
              <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
                {formatarBRL(item.valorUnitarioCentavos)} cada
              </Text>
            </View>
            <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
              {formatarBRL(totalDoItem(item.valorUnitarioCentavos, item.quantidadeMilesimos))}
            </Text>
            <Pressable
              onPress={() => setItens((atuais) => atuais.filter((_, i) => i !== indice))}
              hitSlop={12}
              accessibilityLabel={`Remover ${item.descricao}`}>
              <Text style={{ fontSize: tema.fonte.subtitulo, color: tema.cores.divida }}>×</Text>
            </Pressable>
          </View>
        ))}

        <CampoTexto
          rotulo="Item"
          valor={novoProduto}
          aoMudar={setNovoProduto}
          espacoReservado="Ex.: instalação de tomada"
          maiusculaInicial="sentences"
        />

        <View style={{ flexDirection: 'row', gap: tema.espaco.md }}>
          <View style={{ width: 110 }}>
            <CampoTexto
              rotulo="Qtd"
              valor={novaQuantidade}
              aoMudar={setNovaQuantidade}
              tipoTeclado="decimal-pad"
              maiusculaInicial="none"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoTexto
              rotulo="Valor de cada"
              valor={novoValor}
              aoMudar={setNovoValor}
              espacoReservado="0,00"
              tipoTeclado="decimal-pad"
              maiusculaInicial="none"
            />
          </View>
        </View>

        {erroItem != null && (
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erroItem}</Text>
        )}

        <Botao titulo="Adicionar item" variante="secundario" aoTocar={adicionarItem} />
      </Cartao>

      <CampoValor rotulo="Desconto" valor={desconto} aoMudar={setDesconto} />

      <CampoTexto
        rotulo="Observações"
        valor={observacoes}
        aoMudar={setObservacoes}
        multilinha
        maiusculaInicial="sentences"
      />

      <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>Total</Text>
        <Text style={{ fontSize: tema.fonte.gigante, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
          {formatarBRL(total)}
        </Text>
      </Cartao>

      <Botao titulo="Salvar alterações" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
