import { LIMITE_CLIENTES_GRATIS, vagasRestantes } from '@repo/core';
import {
  consultaClientesComSaldo,
  TABELAS_DO_SALDO,
  useConsultaViva,
  type ClienteComSaldo,
} from '@repo/core/db';
import { Botao, Cartao, useTema } from '@repo/ui';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { useLicenca } from '@/licenca';
import { consultarLoja, comprar, restaurar, type EstadoLoja } from '@/loja';

/**
 * Tela do plano.
 *
 * O tom aqui e deliberadamente sem urgencia fabricada: nada de contagem
 * regressiva, desconto que expira ou botao de recusar escrito em cinza claro.
 * O publico deste app desconfia de armadilha por experiencia propria, e uma
 * unica tela agressiva custaria a confianca construida em todas as outras.
 *
 * A tela tambem diz, com todas as letras, o que continua gratuito para sempre.
 * Quem entende que nao vai ser interrompido no meio do expediente e quem fica
 * tempo suficiente no app para um dia decidir pagar.
 */
export default function TelaPlano() {
  const tema = useTema();
  const { plano, definirPlano } = useLicenca();

  const { data } = useConsultaViva(consultaClientesComSaldo(db), TABELAS_DO_SALDO, []);
  const ativos = ((data ?? []) as ClienteComSaldo[]).length;
  const vagas = vagasRestantes(plano, ativos);

  const [loja, setLoja] = useState<EstadoLoja | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    consultarLoja()
      .then(setLoja)
      .catch(() => setLoja({ disponivel: false, motivo: 'Não foi possível falar com a loja.' }));
  }, []);

  async function tentar(acao: () => Promise<'gratis' | 'pago'>, aviso: string) {
    setOcupado(true);
    try {
      const novo = await acao();
      definirPlano(novo, 'loja');
      if (novo === 'pago') Alert.alert('Pronto', 'Seu plano foi liberado. Obrigado!');
    } catch (falha) {
      Alert.alert(aviso, String(falha instanceof Error ? falha.message : falha));
    } finally {
      setOcupado(false);
    }
  }

  if (plano === 'pago') {
    return (
      <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
        <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.sm }}>
          <Text
            style={{
              fontSize: tema.fonte.subtitulo,
              fontWeight: tema.peso.destaque,
              color: tema.cores.primaria,
            }}>
            Plano completo ativo
          </Text>
          <Corpo>
            Clientes sem limite e exportação liberada. Obrigado por sustentar o app.
          </Corpo>
        </Cartao>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}>
      <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
        <Rotulo texto="Seu plano" />
        <Text
          style={{
            fontSize: tema.fonte.titulo,
            fontWeight: tema.peso.destaque,
            color: tema.cores.texto,
          }}>
          Gratuito
        </Text>
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          {ativos} de {LIMITE_CLIENTES_GRATIS} clientes cadastrados
          {vagas != null && vagas > 0 ? ` · cabem mais ${vagas}` : ''}
        </Text>
      </Cartao>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="O plano completo libera" />
        <Item titulo="Clientes sem limite" texto="Cadastre quantos precisar." />
        <Item
          titulo="Exportar em PDF e planilha"
          texto="Extrato do cliente, relatório de quem deve e as planilhas para o computador."
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Continua de graça, sempre" />
        <Item
          titulo="Lançar, receber e cobrar"
          texto="Sem limite de lançamentos. O app nunca para no meio do expediente."
        />
        <Item
          titulo="Backup e restauração"
          texto="Guardar e recuperar a caderneta não é recurso pago. Seus dados são seus."
        />
      </View>

      {loja?.disponivel === true &&
        loja.ofertas.map((oferta) => (
          <View key={oferta.id} style={{ gap: tema.espaco.xs }}>
            <Botao
              titulo={`${oferta.titulo} — ${oferta.preco}`}
              principal
              carregando={ocupado}
              aoTocar={() => tentar(() => comprar(oferta.id), 'Não deu para concluir a compra')}
            />
            <Text
              style={{
                fontSize: tema.fonte.micro,
                color: tema.cores.textoFraco,
                textAlign: 'center',
              }}>
              {oferta.detalhe}
            </Text>
          </View>
        ))}

      {loja?.disponivel === false && (
        <Cartao estilo={{ backgroundColor: tema.cores.alertaFundo, gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.corpo,
              color: tema.cores.alerta,
              fontWeight: tema.peso.forte,
            }}>
            {loja.motivo}
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario }}>
            Tudo que já está no app continua funcionando normalmente.
          </Text>
        </Cartao>
      )}

      <Botao
        titulo="Já comprei em outro celular"
        variante="texto"
        carregando={ocupado}
        aoTocar={() => tentar(restaurar, 'Não deu para restaurar')}
      />
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

function Corpo({ children }: { children: React.ReactNode }) {
  const tema = useTema();
  return (
    <Text
      style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
      {children}
    </Text>
  );
}

function Item({ titulo, texto }: { titulo: string; texto: string }) {
  const tema = useTema();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          fontSize: tema.fonte.corpo,
          fontWeight: tema.peso.forte,
          color: tema.cores.texto,
        }}>
        {titulo}
      </Text>
      <Text
        style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario, lineHeight: 22 }}>
        {texto}
      </Text>
    </View>
  );
}
