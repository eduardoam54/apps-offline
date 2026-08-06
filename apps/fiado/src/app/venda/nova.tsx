import {
  formatarBRL,
  formatarDataBR,
  formatarQuantidade,
  hoje,
  parseQuantidade,
  parseValorBR,
  somar,
  totalDoItem,
  type Centavos,
} from '@repo/core';
import {
  consultaClientesComSaldo,
  consultaProdutosFrequentes,
  lancarVenda,
  TABELAS_DO_SALDO,
  useConsultaViva,
  type ClienteComSaldo,
  type ProdutoFrequente,
} from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, Cartao, useTema } from '@repo/ui';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';

type ItemRascunho = {
  descricao: string;
  quantidadeMilesimos: number;
  valorUnitarioCentavos: Centavos;
};

/**
 * Lancar fiado.
 *
 * A promessa e registrar uma divida em menos de dez segundos atras do balcao.
 * Por isso o campo de valor abre com o teclado numerico ja aberto e e a unica
 * coisa obrigatoria.
 *
 * Os itens sao uma GAVETA: ficam fechados por padrao e so aparecem se o
 * comerciante pedir. Assim quem quer detalhar consegue, e quem so quer anotar
 * "42 reais" nao paga por isso. Havendo itens, o total passa a ser calculado a
 * partir deles e o campo de valor livre some — dois numeros diferentes na mesma
 * tela seria convite a divergencia.
 */
export default function NovaVenda() {
  const tema = useTema();
  const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

  const [valor, setValor] = useState<Centavos>(0);
  const [descricao, setDescricao] = useState('');
  const [itens, setItens] = useState<ItemRascunho[]>([]);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [novoProduto, setNovoProduto] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('1');
  const [novoValor, setNovoValor] = useState('');

  const { data: clientes } = useConsultaViva(consultaClientesComSaldo(db), TABELAS_DO_SALDO, []);
  const { data: frequentes } = useConsultaViva(
    consultaProdutosFrequentes(db),
    ['produto_frequente'],
    []
  );

  const cliente = ((clientes ?? []) as ClienteComSaldo[]).find((c) => c.id === clienteId);
  const sugestoes = (frequentes ?? []) as ProdutoFrequente[];

  const totalDosItens = useMemo(
    () => (itens.length === 0 ? 0 : somar(...itens.map((i) => totalDoItem(i.valorUnitarioCentavos, i.quantidadeMilesimos)))),
    [itens]
  );

  const temItens = itens.length > 0;
  const total = temItens ? totalDosItens : valor;

  const saldoAtual = cliente?.saldoCentavos ?? 0;
  const limite = cliente?.limiteCreditoCentavos ?? null;
  const saldoFuturo = saldoAtual + total;
  const vaiPassarDoLimite = limite != null && total > 0 && saldoFuturo > limite;

  function adicionarItem() {
    const nome = novoProduto.trim();
    const quantidade = parseQuantidade(novaQuantidade);
    const unitario = parseValorBR(novoValor);

    if (nome === '') return setErro('Digite o nome do produto.');
    if (quantidade == null) return setErro('Quantidade inválida.');
    if (unitario == null || unitario <= 0) return setErro('Valor do produto inválido.');

    setItens((atuais) => [
      ...atuais,
      { descricao: nome, quantidadeMilesimos: quantidade, valorUnitarioCentavos: unitario },
    ]);
    setNovoProduto('');
    setNovaQuantidade('1');
    setNovoValor('');
    setErro(null);
  }

  function usarSugestao(produto: ProdutoFrequente) {
    setNovoProduto(produto.descricao);
    setNovoValor(formatarBRL(produto.valorPadraoCentavos).replace('R$ ', ''));
  }

  async function salvar() {
    if (total <= 0) {
      setErro('Digite um valor maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await lancarVenda(db, {
        clienteId,
        valorCentavos: temItens ? undefined : valor,
        itens: temItens ? itens : undefined,
        descricao,
        data: hoje(),
      });
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

      {temItens ? (
        <View style={{ gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.pequeno,
              fontWeight: tema.peso.medio,
              color: tema.cores.textoSecundario,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            Total dos itens
          </Text>
          <Text
            style={{
              fontSize: tema.fonte.gigante,
              fontWeight: tema.peso.destaque,
              color: tema.cores.texto,
            }}>
            {formatarBRL(totalDosItens)}
          </Text>
        </View>
      ) : (
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
      )}

      {!gavetaAberta && !temItens && (
        <Botao
          titulo="Detalhar o que levou"
          variante="texto"
          aoTocar={() => setGavetaAberta(true)}
        />
      )}

      {(gavetaAberta || temItens) && (
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

              <Text
                style={{
                  fontSize: tema.fonte.corpo,
                  fontWeight: tema.peso.forte,
                  color: tema.cores.texto,
                }}>
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

          {sugestoes.length > 0 && novoProduto === '' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espaco.sm }}>
              {sugestoes.map((produto) => (
                <Pressable
                  key={produto.id}
                  onPress={() => usarSugestao(produto)}
                  style={{
                    minHeight: tema.toque.minimo,
                    justifyContent: 'center',
                    paddingHorizontal: tema.espaco.lg,
                    borderRadius: tema.raio.pilula,
                    borderWidth: 1,
                    borderColor: tema.cores.bordaForte,
                    backgroundColor: tema.cores.superficie,
                  }}>
                  <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.texto }}>
                    {produto.descricao}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <CampoTexto
            rotulo="Produto"
            valor={novoProduto}
            aoMudar={setNovoProduto}
            espacoReservado="Ex.: pão francês"
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

          {erro != null && temItens && (
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.divida }}>{erro}</Text>
          )}

          <Botao titulo="Adicionar item" variante="secundario" aoTocar={adicionarItem} />
        </Cartao>
      )}

      {vaiPassarDoLimite && (
        <View
          style={{
            backgroundColor: tema.cores.alertaFundo,
            borderRadius: tema.raio.md,
            padding: tema.espaco.lg,
            gap: tema.espaco.xs,
          }}>
          <Text
            style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.alerta }}>
            Vai passar do limite
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta }}>
            O saldo vai para {formatarBRL(saldoFuturo)}, acima do limite de {formatarBRL(limite!)}.
            Você pode lançar assim mesmo.
          </Text>
        </View>
      )}

      <CampoTexto
        rotulo="Observação (opcional)"
        valor={descricao}
        aoMudar={setDescricao}
        espacoReservado="Alguma anotação sobre esta compra"
        maiusculaInicial="sentences"
      />

      <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
          Data: {formatarDataBR(hoje())}
        </Text>
        {total > 0 && (
          <Text
            style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto, fontWeight: tema.peso.forte }}>
            Novo saldo: {formatarBRL(saldoFuturo)}
          </Text>
        )}
      </Cartao>

      <Botao titulo="Lançar fiado" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
