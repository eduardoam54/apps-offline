import { recursoLiberado } from '@repo/core';
import { Botao, Cartao, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import {
  exportarClientesEmCsv,
  exportarLancamentosEmCsv,
  exportarRelatorioDeDevedores,
} from '@/exportar';
import { useConfig } from '@/hooks/useConfig';
import { useLicenca } from '@/licenca';

/**
 * Tela de exportacao.
 *
 * O extrato de UM cliente nao esta aqui de proposito — ele fica no botao dentro
 * da tela do proprio cliente. E la que o comerciante esta quando o cliente
 * pergunta "eu devo tudo isso?", e obrigar a sair, vir ate ajustes e escolher o
 * cliente de novo perderia o momento em que o documento e util.
 */
export default function TelaExportar() {
  const tema = useTema();
  const config = useConfig();
  const plano = useLicenca((e) => e.plano);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const liberado = recursoLiberado('exportar', plano);
  const loja = { nome: config.nomeDaLoja, telefone: config.telefoneDaLoja || null };

  /**
   * Bloqueado leva para o plano em vez de sumir da tela.
   *
   * Esconder o recurso deixaria a tela mais limpa e o comerciante sem saber o
   * que ele ganharia pagando. Ele precisa ver o que existe — e chegar la sem
   * susto, porque nada aqui e cobrado sem antes ser explicado.
   */
  async function exportar(qual: string, acao: () => Promise<boolean>) {
    if (!liberado) {
      router.push('/plano');
      return;
    }

    setOcupado(qual);
    try {
      const compartilhou = await acao();
      if (!compartilhou) {
        Alert.alert(
          'Compartilhamento indisponível',
          'Este aparelho não oferece o menu de compartilhar arquivos.'
        );
      }
    } catch (falha) {
      Alert.alert('Não deu para exportar', String(falha));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
      {!liberado && (
        <Cartao estilo={{ backgroundColor: tema.cores.primariaClara, gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.corpo,
              fontWeight: tema.peso.forte,
              color: tema.cores.primariaEscura,
            }}>
            Exportar faz parte do plano completo
          </Text>
          <Text
            style={{
              fontSize: tema.fonte.pequeno,
              color: tema.cores.textoSecundario,
              lineHeight: 22,
            }}>
            Backup e restauração continuam de graça — exportar é para levar o histórico
            para fora do app, em documento ou planilha.
          </Text>
        </Cartao>
      )}

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Documento em PDF" />
        <Texto>
          Gera a lista de quem está devendo, com telefone e data da última compra.
          É para você — imprimir, guardar ou mandar para quem cuida do caixa.
        </Texto>
        <Botao
          titulo="Relatório de quem está devendo"
          principal
          carregando={ocupado === 'devedores'}
          desabilitado={ocupado != null && ocupado !== 'devedores'}
          aoTocar={() => exportar('devedores', () => exportarRelatorioDeDevedores(loja))}
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Planilha para o computador" />
        <Texto>
          Abre no Excel, no Google Planilhas ou no LibreOffice. Serve para somar,
          filtrar e conferir com calma fora do balcão.
        </Texto>
        <Botao
          titulo="Todos os lançamentos"
          variante="secundario"
          carregando={ocupado === 'lancamentos'}
          desabilitado={ocupado != null && ocupado !== 'lancamentos'}
          aoTocar={() => exportar('lancamentos', exportarLancamentosEmCsv)}
        />
        <Botao
          titulo="Lista de clientes e saldos"
          variante="secundario"
          carregando={ocupado === 'clientes'}
          desabilitado={ocupado != null && ocupado !== 'clientes'}
          aoTocar={() => exportar('clientes', exportarClientesEmCsv)}
        />
      </View>

      <Texto pequeno>
        O extrato de um cliente sai pela tela dele, no botão “Extrato em PDF”.
      </Texto>

      <Texto pequeno>
        Exportar não é backup: o arquivo serve para ler e conferir, mas não volta
        para dentro do app. Para poder restaurar a caderneta, use Backup.
      </Texto>
    </ScrollView>
  );
}

function Rotulo({ texto }: { texto: string }) {
  const tema = useTema();
  return (
    <Text
      style={{
        fontSize: tema.fonte.pequeno,
        fontWeight: tema.peso.forte,
        color: tema.cores.textoSecundario,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
      {texto}
    </Text>
  );
}

function Texto({ children, pequeno }: { children: React.ReactNode; pequeno?: boolean }) {
  const tema = useTema();
  return (
    <Text
      style={{
        fontSize: pequeno ? tema.fonte.pequeno : tema.fonte.corpo,
        color: pequeno ? tema.cores.textoFraco : tema.cores.textoSecundario,
        lineHeight: pequeno ? 22 : 24,
      }}>
      {children}
    </Text>
  );
}
