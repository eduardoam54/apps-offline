import {
  combinaComBusca,
  formatarBRL,
  formatarQuantidade,
  hoje,
  limitesDoMes,
  parseQuantidade,
  parseValorBR,
  podeCriarOrcamento,
  somar,
  totalDoItem,
  type Centavos,
} from '@repo/core';
import {
  buscarCliente,
  consultaClientesAtivos,
  consultaOrcamentosDoPeriodo,
  consultaProdutosFrequentes,
  criarCliente,
  criarOrcamento,
  useConsultaViva,
  type Cliente,
  type ProdutoFrequente,
} from '@repo/core/db';
import { Botao, CampoTexto, CampoValor, Cartao, useTema } from '@repo/ui';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { useLicenca } from '@/licenca';

type ItemRascunho = {
  descricao: string;
  quantidadeMilesimos: number;
  valorUnitarioCentavos: Centavos;
};

export default function NovoOrcamento() {
  const tema = useTema();
  const { clienteId } = useLocalSearchParams<{ clienteId?: string }>();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [novoClienteAberto, setNovoClienteAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');

  const [itens, setItens] = useState<ItemRascunho[]>([]);
  const [novoProduto, setNovoProduto] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('1');
  const [novoValor, setNovoValor] = useState('');
  const [erroItem, setErroItem] = useState<string | null>(null);

  const [desconto, setDesconto] = useState<Centavos>(0);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  const { data: clientesData } = useConsultaViva(consultaClientesAtivos(db), ['cliente'], []);
  const clientes = (clientesData ?? []) as Cliente[];
  const clientesVisiveis = useMemo(
    () => clientes.filter((c) => combinaComBusca(buscaCliente, c.nome, c.apelido, c.telefone)),
    [clientes, buscaCliente]
  );

  const { data: frequentesData } = useConsultaViva(
    consultaProdutosFrequentes(db),
    ['produto_frequente'],
    []
  );
  const sugestoes = (frequentesData ?? []) as ProdutoFrequente[];

  const plano = useLicenca((e) => e.plano);
  const mes = useMemo(() => limitesDoMes(hoje()), []);
  const { data: orcamentosDoMes } = useConsultaViva(
    consultaOrcamentosDoPeriodo(db, mes.inicio, mes.fim),
    ['orcamento'],
    [mes.inicio, mes.fim]
  );
  const cabeMais = podeCriarOrcamento(plano, (orcamentosDoMes ?? []).length);

  useEffect(() => {
    if (clienteId == null) return;
    let ativo = true;
    buscarCliente(db, clienteId).then((c) => {
      if (ativo) setCliente(c);
    });
    return () => {
      ativo = false;
    };
  }, [clienteId]);

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

  function usarSugestao(produto: ProdutoFrequente) {
    setNovoProduto(produto.descricao);
    setNovoValor(formatarBRL(produto.valorPadraoCentavos).replace('R$ ', ''));
  }

  async function criarClienteInline() {
    const nome = novoNome.trim();
    if (nome === '') return;
    const c = await criarCliente(db, { nome, telefone: novoTelefone });
    setCliente(c);
    setNovoClienteAberto(false);
  }

  async function salvar() {
    if (cliente == null) return;
    if (itens.length === 0) {
      setErroItem('Adicione pelo menos um item.');
      return;
    }

    setSalvando(true);
    try {
      const { orcamento } = await criarOrcamento(db, {
        clienteId: cliente.id,
        itens,
        descontoCentavos: desconto,
        observacoes,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/orcamento/${orcamento.id}`);
    } catch (falha) {
      Alert.alert('Não deu para criar o orçamento', String(falha));
      setSalvando(false);
    }
  }

  // O aviso vem ANTES de escolher cliente e digitar itens, nunca depois: deixar
  // o profissional preencher tudo para so entao dizer que nao cabe seria
  // desrespeito com quem esta fechando um orcamento na frente do cliente dele.
  if (!cabeMais) {
    return (
      <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
        <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.md }}>
          <Text
            style={{ fontSize: tema.fonte.subtitulo, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
            O plano gratuito vai até 3 orçamentos por mês
          </Text>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
            O limite reinicia todo mês. Tudo que já está no app continua funcionando
            normalmente — aprovar, duplicar e compartilhar não têm limite.
          </Text>
        </Cartao>

        <Botao titulo="Ver o plano completo" principal aoTocar={() => router.replace('/plano')} />
      </ScrollView>
    );
  }

  // Sem cliente escolhido: mostra o seletor primeiro. Nao faz sentido comecar a
  // digitar itens sem saber para quem e o orcamento.
  if (cliente == null) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.cores.superficie }}>
        <View style={{ padding: tema.espaco.lg, gap: tema.espaco.md }}>
          <CampoTexto
            rotulo="Cliente"
            valor={buscaCliente}
            aoMudar={setBuscaCliente}
            espacoReservado="Buscar por nome ou telefone"
            autoFoco
          />
          <Botao
            titulo="+ Novo cliente"
            variante="texto"
            aoTocar={() => setNovoClienteAberto((a) => !a)}
          />

          {novoClienteAberto && (
            <Cartao estilo={{ gap: tema.espaco.md }}>
              <CampoTexto rotulo="Nome *" valor={novoNome} aoMudar={setNovoNome} autoFoco />
              <CampoTexto
                rotulo="Telefone"
                valor={novoTelefone}
                aoMudar={setNovoTelefone}
                tipoTeclado="phone-pad"
                maiusculaInicial="none"
              />
              <Botao titulo="Usar este cliente" variante="secundario" aoTocar={criarClienteInline} />
            </Cartao>
          )}
        </View>

        <FlatList
          data={clientesVisiveis}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCliente(item)}
              style={{
                paddingVertical: tema.espaco.md,
                paddingHorizontal: tema.espaco.lg,
                minHeight: tema.toque.minimo,
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>{item.nome}</Text>
              {item.telefone != null && (
                <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
                  {item.telefone}
                </Text>
              )}
            </Pressable>
          )}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => setCliente(null)}>
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          Cliente: <Text style={{ fontWeight: tema.peso.forte, color: tema.cores.texto }}>{cliente.nome}</Text>
          {'  ·  trocar'}
        </Text>
      </Pressable>

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
        espacoReservado="Condições de pagamento, prazo, garantia..."
        multilinha
        maiusculaInicial="sentences"
      />

      <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
        <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>Total</Text>
        <Text style={{ fontSize: tema.fonte.gigante, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
          {formatarBRL(total)}
        </Text>
      </Cartao>

      <Botao titulo="Criar orçamento" principal carregando={salvando} aoTocar={salvar} />
    </ScrollView>
  );
}
