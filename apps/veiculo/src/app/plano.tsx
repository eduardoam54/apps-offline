import { consultaVeiculos, useConsultaViva, type Veiculo } from '@repo/core/db';
import { podeCadastrarVeiculo, LIMITE_VEICULOS_GRATIS } from '@repo/core';
import { Botao, Cartao, useTema } from '@repo/ui';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { db } from '@/db';
import { useLicenca } from '@/licenca';
import { comprar, consultarLoja, restaurar, type EstadoLoja } from '@/loja';

export default function TelaPlano() {
  const tema = useTema();
  const { plano, definirPlano } = useLicenca();

  const { data: veiculos } = useConsultaViva(consultaVeiculos(db), ['veiculo'], []);
  const veiculosAtivos = (veiculos ?? []).length;

  const [loja, setLoja] = useState<EstadoLoja | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    consultarLoja()
      .then(setLoja)
      .catch(() =>
        setLoja({ disponivel: false, motivo: 'Não foi possível falar com a loja.' })
      );
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
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario, lineHeight: 24 }}>
            Veículos sem limite e backup liberado. Obrigado por sustentar o app.
          </Text>
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
          {veiculosAtivos} {veiculosAtivos === 1 ? 'veículo ativo' : 'veículos ativos'} ·{' '}
          limite de {LIMITE_VEICULOS_GRATIS}
        </Text>
      </Cartao>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="O plano completo libera" />
        <Item
          titulo="Veículos sem limite"
          texto="Registre quantos carros, motos e caminhões precisar."
        />
        <Item
          titulo="Backup e restauração"
          texto="Exporte o histórico completo para guardar onde quiser."
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Rotulo texto="Continua de graça, sempre" />
        <Item
          titulo="Registrar abastecimentos"
          texto="Sem limite de registros por veículo."
        />
        <Item
          titulo="Registrar manutenções"
          texto="Histórico completo de revisões e reparos."
        />
        <Item
          titulo="Lembretes por km ou data"
          texto="Alertas de troca de óleo, revisão e vencimento de seguro."
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
