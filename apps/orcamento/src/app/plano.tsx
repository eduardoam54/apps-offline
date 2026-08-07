import { hoje, LIMITE_ORCAMENTOS_GRATIS_MES, limitesDoMes, orcamentosRestantesNoMes } from '@repo/core';
import { consultaOrcamentosDoPeriodo, useConsultaViva } from '@repo/core/db';
import { Botao, Cartao, useTema } from '@repo/ui';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { useLicenca } from '@/licenca';
import { comprar, consultarLoja, restaurar, type EstadoLoja } from '@/loja';

/**
 * Tela do plano.
 *
 * Mesmo tom do fiado: sem urgencia fabricada, e a tela diz com todas as letras
 * o que continua gratuito para sempre. Ver `apps/fiado/src/app/plano.tsx`.
 */
export default function TelaPlano() {
  const tema = useTema();
  const { plano, definirPlano } = useLicenca();

  const mes = useMemo(() => limitesDoMes(hoje()), []);
  const { data } = useConsultaViva(
    consultaOrcamentosDoPeriodo(db, mes.inicio, mes.fim),
    ['orcamento'],
    [mes.inicio, mes.fim]
  );
  const orcamentosNoMes = (data ?? []).length;
  const restantes = orcamentosRestantesNoMes(plano, orcamentosNoMes);

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
            Orçamentos sem limite, sem marca d'água e exportação liberada. Obrigado por sustentar
            o app.
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
          style={{ fontSize: tema.fonte.titulo, fontWeight: tema.peso.destaque, color: tema.cores.texto }}>
          Gratuito
        </Text>
        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
          {orcamentosNoMes} de {LIMITE_ORCAMENTOS_GRATIS_MES} orçamentos criados este mês
          {restantes != null && restantes > 0 ? ` · cabem mais ${restantes}` : ''}
        </Text>
      </Cartao>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="O plano completo libera" />
        <Item titulo="Orçamentos sem limite" texto="Crie quantos precisar, todo mês." />
        <Item titulo="PDF sem marca d'água" texto="O documento sai limpo, com a cara da sua empresa." />
        <Item
          titulo="Exportar histórico em planilha"
          texto="Todos os orçamentos, prontos para conferir no computador."
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Continua de graça, sempre" />
        <Item
          titulo="Criar, aprovar e duplicar orçamentos"
          texto="Dentro do limite mensal, sem restrição nenhuma."
        />
        <Item
          titulo="Compartilhar no WhatsApp"
          texto="Gerar e enviar o PDF nunca fica bloqueado."
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
              style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco, textAlign: 'center' }}>
              {oferta.detalhe}
            </Text>
          </View>
        ))}

      {loja?.disponivel === false && (
        <Cartao estilo={{ backgroundColor: tema.cores.alertaFundo, gap: tema.espaco.xs }}>
          <Text
            style={{ fontSize: tema.fonte.corpo, color: tema.cores.alerta, fontWeight: tema.peso.forte }}>
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
    <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
      {children}
    </Text>
  );
}

function Item({ titulo, texto }: { titulo: string; texto: string }) {
  const tema = useTema();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.texto }}>
        {titulo}
      </Text>
      <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.textoSecundario, lineHeight: 22 }}>
        {texto}
      </Text>
    </View>
  );
}
