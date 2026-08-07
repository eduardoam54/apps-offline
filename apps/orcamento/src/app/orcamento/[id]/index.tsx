import { formatarBRL, formatarDataBR, formatarQuantidade } from '@repo/core';
import {
  aprovarOrcamento,
  buscarCliente,
  buscarOrcamento,
  duplicarOrcamento,
  itensDoOrcamento,
  reabrirOrcamento,
  recusarOrcamento,
  type BancoSQLite,
  type Cliente,
  type Orcamento,
  type OrcamentoItem,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, useTema } from '@repo/ui';
import { File } from 'expo-file-system';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { exportarOrcamentoEmPdf } from '@/exportar';
import { useEmpresa } from '@/hooks/useEmpresa';
import { useLicenca } from '@/licenca';
import { corDoStatus, rotuloStatus } from '@/status';

export default function DetalheOrcamento() {
  const tema = useTema();
  const empresa = useEmpresa();
  const plano = useLicenca((e) => e.plano);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [orcamento, setOrcamento] = useState<Orcamento | null | undefined>(undefined);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [processando, setProcessando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const carregar = useCallback(async () => {
    const orc = await buscarOrcamento(db, id);
    setOrcamento(orc);
    if (orc == null) return;
    const [c, i] = await Promise.all([buscarCliente(db, orc.clienteId), itensDoOrcamento(db, id)]);
    setCliente(c);
    setItens(i);
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (orcamento === undefined) return null;

  if (orcamento == null) {
    return (
      <EstadoVazio
        titulo="Orçamento não encontrado"
        texto="Ele pode ter sido excluído."
        acao={{ titulo: 'Voltar', aoTocar: () => router.back() }}
      />
    );
  }

  async function mudarStatus(acao: (db: BancoSQLite, id: string) => Promise<void>) {
    setProcessando(true);
    try {
      await acao(db, id);
      await carregar();
    } catch (falha) {
      Alert.alert('Não deu para atualizar', String(falha));
    } finally {
      setProcessando(false);
    }
  }

  async function compartilharPdf() {
    if (orcamento == null || cliente == null) return;
    setGerandoPdf(true);
    try {
      const logoBase64 =
        empresa.logoUri === '' ? null : await new File(empresa.logoUri).base64().catch(() => null);

      const compartilhou = await exportarOrcamentoEmPdf({
        empresa: {
          nome: empresa.nome,
          telefone: empresa.telefone || null,
          documento: empresa.documento || null,
        },
        logoBase64,
        cliente: { nome: cliente.nome, telefone: cliente.telefone },
        numero: orcamento.numero,
        data: orcamento.data,
        itens: itens.map((i) => ({
          descricao: i.descricao,
          quantidadeMilesimos: i.quantidadeMilesimos,
          valorUnitarioCentavos: i.valorUnitarioCentavos,
        })),
        descontoCentavos: orcamento.descontoCentavos,
        totalCentavos: orcamento.totalCentavos,
        observacoes: orcamento.observacoes,
        marcaDagua: plano !== 'pago',
      });

      if (!compartilhou) {
        Alert.alert(
          'Compartilhamento indisponível',
          'Este aparelho não oferece o menu de compartilhar arquivos.'
        );
      }
    } catch (falha) {
      Alert.alert('Não deu para gerar o PDF', String(falha));
    } finally {
      setGerandoPdf(false);
    }
  }

  async function duplicar() {
    setProcessando(true);
    try {
      const { orcamento: copia } = await duplicarOrcamento(db, id);
      router.replace(`/orcamento/${copia.id}`);
    } catch (falha) {
      Alert.alert('Não deu para duplicar', String(falha));
      setProcessando(false);
    }
  }

  const podeEditar = orcamento.status === 'aberto';

  return (
    <>
      <Stack.Screen
        options={{
          title: `Orçamento #${orcamento.numero}`,
          headerRight: podeEditar
            ? () => (
                <Pressable onPress={() => router.push(`/orcamento/${id}/editar`)} hitSlop={12}>
                  <Text
                    style={{
                      color: tema.cores.textoInverso,
                      fontSize: tema.fonte.corpo,
                      fontWeight: tema.peso.forte,
                    }}>
                    Editar
                  </Text>
                </Pressable>
              )
            : undefined,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}>
        <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.pequeno,
              fontWeight: tema.peso.medio,
              color: corDoStatus(orcamento.status, tema.cores),
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            {rotuloStatus(orcamento.status)}
          </Text>
          <Text style={{ fontSize: tema.fonte.gigante, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
            {formatarBRL(orcamento.totalCentavos)}
          </Text>
          {cliente != null && (
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
              {cliente.nome}
            </Text>
          )}
          <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
            Data: {formatarDataBR(orcamento.data)}
          </Text>
        </Cartao>

        <View
          style={{
            backgroundColor: tema.cores.fundo,
            borderRadius: tema.raio.lg,
            overflow: 'hidden',
            ...tema.sombra.card,
          }}>
          {itens.map((item, indice) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tema.espaco.md,
                padding: tema.espaco.lg,
                borderTopWidth: indice === 0 ? 0 : 1,
                borderTopColor: tema.cores.borda,
              }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
                  {formatarQuantidade(item.quantidadeMilesimos)} × {item.descricao}
                </Text>
                <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
                  {formatarBRL(item.valorUnitarioCentavos)} cada
                </Text>
              </View>
              <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
                {formatarBRL(
                  Math.round((item.valorUnitarioCentavos * item.quantidadeMilesimos) / 1000)
                )}
              </Text>
            </View>
          ))}
        </View>

        {orcamento.descontoCentavos > 0 && (
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
            Desconto: {formatarBRL(orcamento.descontoCentavos)}
          </Text>
        )}

        {orcamento.observacoes != null && (
          <Cartao estilo={{ gap: tema.espaco.xs }}>
            <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
              Observações
            </Text>
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto }}>
              {orcamento.observacoes}
            </Text>
          </Cartao>
        )}

        <View style={{ gap: tema.espaco.md }}>
          <Botao
            titulo="Compartilhar PDF"
            variante="secundario"
            carregando={gerandoPdf}
            aoTocar={compartilharPdf}
          />

          {orcamento.status === 'aberto' && (
            <View style={{ flexDirection: 'row', gap: tema.espaco.md }}>
              <Botao
                titulo="Aprovar"
                principal
                carregando={processando}
                aoTocar={() => mudarStatus(aprovarOrcamento)}
                estilo={{ flex: 1 }}
              />
              <Botao
                titulo="Recusar"
                variante="secundario"
                carregando={processando}
                aoTocar={() => mudarStatus(recusarOrcamento)}
                estilo={{ flex: 1 }}
              />
            </View>
          )}

          {orcamento.status !== 'aberto' && (
            <Botao
              titulo="Reabrir"
              variante="secundario"
              carregando={processando}
              aoTocar={() => mudarStatus(reabrirOrcamento)}
            />
          )}

          <Botao titulo="Duplicar orçamento" variante="texto" carregando={processando} aoTocar={duplicar} />
        </View>
      </ScrollView>
    </>
  );
}
