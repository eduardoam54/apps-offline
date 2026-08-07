import { diasEntre, formatarBRL, hoje, limitesDoMes } from '@repo/core';
import {
  consultaClientesComSaldo,
  consultaParcelasVencidas,
  consultaRecebidoNoPeriodo,
  consultaTotalAReceber,
  TABELAS_DO_SALDO,
  useConsultaViva,
  type ClienteComSaldo,
  type ParcelaVencida,
} from '@repo/core/db';
import { Botao, Cartao, EstadoVazio, Separador, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { LinhaCliente } from '@/components/LinhaCliente';
import { db } from '@/db';

const QUANTOS_DEVEDORES = 5;
const DIAS_PARA_ALERTAR = 30;

export default function Inicio() {
  const tema = useTema();
  const mes = useMemo(() => limitesDoMes(hoje()), []);

  const { data: totais } = useConsultaViva(consultaTotalAReceber(db), TABELAS_DO_SALDO, []);
  const { data: clientes } = useConsultaViva(consultaClientesComSaldo(db), TABELAS_DO_SALDO, []);
  const { data: recebido } = useConsultaViva(
    consultaRecebidoNoPeriodo(db, mes.inicio, mes.fim),
    ['pagamento'],
    [mes.inicio, mes.fim]
  );

  const aReceber = totais?.[0]?.total ?? 0;
  const recebidoNoMes = recebido?.[0]?.total ?? 0;
  const lista = (clientes ?? []) as ClienteComSaldo[];

  // Uma parcela e quitada gravando um pagamento e marcando a parcela, e o nome
  // do cliente vem por SQL cru — as tres tabelas precisam estar na lista.
  const { data: vencidas } = useConsultaViva(
    consultaParcelasVencidas(db, hoje()),
    ['acordo_parcela', 'acordo', 'cliente'],
    []
  );

  const devedores = useMemo(() => lista.filter((c) => c.saldoCentavos > 0), [lista]);
  const alertas = useMemo(
    () => calcularAlertas(devedores, (vencidas ?? []) as ParcelaVencida[]),
    [devedores, vencidas]
  );

  return (
    <ScrollView contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}>
      <Cartao estilo={{ padding: tema.espaco.xl, gap: tema.espaco.xs }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            color: tema.cores.textoSecundario,
            fontWeight: tema.peso.medio,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Total a receber
        </Text>

        <Text
          style={{
            fontSize: tema.fonte.gigante,
            fontWeight: tema.peso.destaque,
            color: aReceber > 0 ? tema.cores.divida : tema.cores.textoFraco,
          }}>
          {formatarBRL(aReceber)}
        </Text>

        <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoFraco }}>
          {resumo(lista.length, devedores.length)}
        </Text>

        {recebidoNoMes > 0 && (
          <View
            style={{
              marginTop: tema.espaco.md,
              paddingTop: tema.espaco.md,
              borderTopWidth: 1,
              borderTopColor: tema.cores.borda,
            }}>
            <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.textoSecundario }}>
              Recebido este mês:{' '}
              <Text style={{ color: tema.cores.pago, fontWeight: tema.peso.destaque }}>
                {formatarBRL(recebidoNoMes)}
              </Text>
            </Text>
          </View>
        )}
      </Cartao>

      {alertas.map((alerta) => (
        <View
          key={alerta.chave}
          style={{
            backgroundColor: tema.cores.alertaFundo,
            borderRadius: tema.raio.md,
            padding: tema.espaco.lg,
            gap: tema.espaco.xs,
          }}>
          <Text
            style={{ fontSize: tema.fonte.corpo, fontWeight: tema.peso.forte, color: tema.cores.alerta }}>
            {alerta.titulo}
          </Text>
          <Text style={{ fontSize: tema.fonte.pequeno, color: tema.cores.alerta }}>
            {alerta.detalhe}
          </Text>
        </View>
      ))}

      {lista.length === 0 ? (
        <EstadoVazio
          icone="menu-book"
          titulo="Sua caderneta está vazia"
          texto="Cadastre o primeiro cliente para começar a anotar o fiado."
          acao={{ titulo: 'Cadastrar cliente', aoTocar: () => router.push('/cliente/novo') }}
        />
      ) : (
        <View style={{ gap: tema.espaco.sm }}>
          <Text
            style={{
              fontSize: tema.fonte.pequeno,
              fontWeight: tema.peso.forte,
              color: tema.cores.textoSecundario,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: tema.espaco.xs,
            }}>
            {devedores.length > 0 ? 'Quem mais deve' : 'Clientes'}
          </Text>

          {devedores.length === 0 ? (
            <Cartao estilo={{ alignItems: 'center', paddingVertical: tema.espaco.xl }}>
              <Text
                style={{ fontSize: tema.fonte.corpo, color: tema.cores.pago, fontWeight: tema.peso.forte }}>
                Ninguém devendo no momento
              </Text>
            </Cartao>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: tema.cores.fundo,
                  borderRadius: tema.raio.lg,
                  overflow: 'hidden',
                  ...tema.sombra.card,
                }}>
                {devedores.slice(0, QUANTOS_DEVEDORES).map((cliente, indice) => (
                  <View key={cliente.id}>
                    {indice > 0 && <Separador />}
                    <LinhaCliente
                      cliente={cliente}
                      aoTocar={() => router.push(`/cliente/${cliente.id}`)}
                    />
                  </View>
                ))}
              </View>

              <Botao
                titulo={`Cobrar no WhatsApp (${devedores.length})`}
                principal
                aoTocar={() => router.push('/cobranca/lote')}
                estilo={{ marginTop: tema.espaco.sm }}
              />
            </>
          )}

          {devedores.length > QUANTOS_DEVEDORES && (
            <Botao
              titulo={`Ver todos os ${lista.length} clientes`}
              variante="texto"
              aoTocar={() => router.push('/clientes')}
            />
          )}

          <Botao
            titulo="Cadastrar cliente"
            variante="secundario"
            aoTocar={() => router.push('/cliente/novo')}
          />
        </View>
      )}
    </ScrollView>
  );
}

type Alerta = { chave: string; titulo: string; detalhe: string };

/**
 * Alertas da tela inicial.
 *
 * So dois tipos, e os dois exigem acao de cobranca. A tentacao seria alertar
 * sobre tudo, mas painel cheio de aviso permanente ensina o comerciante a
 * ignorar todos eles — inclusive o que importava.
 */
function calcularAlertas(devedores: ClienteComSaldo[], vencidas: ParcelaVencida[]): Alerta[] {
  const alertas: Alerta[] = [];

  // Parcela vencida vem primeiro: e um compromisso que o cliente assumiu e
  // deixou de cumprir, mais grave do que divida solta em aberto.
  if (vencidas.length > 0) {
    const nomes = [...new Set(vencidas.map((v) => v.clienteNome))];
    alertas.push({
      chave: 'parcelas',
      titulo:
        vencidas.length === 1
          ? '1 parcela de acordo vencida'
          : `${vencidas.length} parcelas de acordo vencidas`,
      detalhe: nomes.join(', '),
    });
  }

  const acimaDoLimite = devedores.filter(
    (c) => c.limiteCreditoCentavos != null && c.saldoCentavos > c.limiteCreditoCentavos
  );

  if (acimaDoLimite.length > 0) {
    alertas.push({
      chave: 'limite',
      titulo:
        acimaDoLimite.length === 1
          ? '1 cliente passou do limite'
          : `${acimaDoLimite.length} clientes passaram do limite`,
      detalhe: acimaDoLimite.map((c) => c.nome).join(', '),
    });
  }

  const parados = devedores.filter((c) => {
    const referencia = c.ultimoPagamento ?? c.ultimaCompra;
    return referencia != null && diasEntre(referencia, hoje()) >= DIAS_PARA_ALERTAR;
  });

  if (parados.length > 0) {
    alertas.push({
      chave: 'parados',
      titulo:
        parados.length === 1
          ? `1 cliente sem pagar há mais de ${DIAS_PARA_ALERTAR} dias`
          : `${parados.length} clientes sem pagar há mais de ${DIAS_PARA_ALERTAR} dias`,
      detalhe: parados.map((c) => c.nome).join(', '),
    });
  }

  return alertas;
}

function resumo(total: number, devendo: number): string {
  if (total === 0) return 'Nenhum cliente cadastrado';
  if (devendo === 0) return `${total} ${total === 1 ? 'cliente' : 'clientes'} · ninguém devendo`;
  return `${devendo} de ${total} ${total === 1 ? 'cliente' : 'clientes'} devendo`;
}
