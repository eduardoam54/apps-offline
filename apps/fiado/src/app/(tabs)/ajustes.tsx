import { CHAVES, gravarConfig } from '@repo/core/db';
import { TEMPLATE_COBRANCA_PADRAO, VARIAVEIS_COBRANCA } from '@repo/docs';
import { Botao, CampoTexto, Cartao, useTema } from '@repo/ui';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { montarMensagem } from '@/cobranca';
import { db } from '@/db';
import { useConfig } from '@/hooks/useConfig';

const CLIENTE_EXEMPLO = {
  id: 'exemplo',
  nome: 'João da Silva',
  telefone: null,
  saldoCentavos: 4200,
};

export default function Ajustes() {
  const tema = useTema();
  const config = useConfig();

  const [nomeDaLoja, setNomeDaLoja] = useState(config.nomeDaLoja);
  const [telefone, setTelefone] = useState(config.telefoneDaLoja);
  const [template, setTemplate] = useState(config.templateCobranca);
  const [carregado, setCarregado] = useState(false);

  // A configuracao chega por consulta ao vivo, entao os campos comecam vazios e
  // sao preenchidos quando ela carrega. Isso acontece uma vez so — depois disso
  // quem manda no campo e quem esta digitando.
  useEffect(() => {
    if (!carregado && config.templateCobranca !== '') {
      setNomeDaLoja(config.nomeDaLoja);
      setTelefone(config.telefoneDaLoja);
      setTemplate(config.templateCobranca);
      setCarregado(true);
    }
  }, [config, carregado]);

  async function salvar() {
    await gravarConfig(db, CHAVES.nomeDaLoja, nomeDaLoja);
    await gravarConfig(db, CHAVES.telefoneDaLoja, telefone);
    await gravarConfig(db, CHAVES.templateCobranca, template);
  }

  const previa = montarMensagem(CLIENTE_EXEMPLO, { nomeDaLoja, template });

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.xl }}
      keyboardShouldPersistTaps="handled">
      <View style={{ gap: tema.espaco.lg }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.forte,
            color: tema.cores.textoSecundario,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Sua loja
        </Text>

        <CampoTexto
          rotulo="Nome da loja"
          valor={nomeDaLoja}
          aoMudar={setNomeDaLoja}
          espacoReservado="Ex.: Mercadinho do Zé"
        />

        <CampoTexto
          rotulo="Telefone"
          valor={telefone}
          aoMudar={setTelefone}
          espacoReservado="(00) 00000-0000"
          tipoTeclado="phone-pad"
          maiusculaInicial="none"
        />
      </View>

      <View style={{ gap: tema.espaco.md }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.forte,
            color: tema.cores.textoSecundario,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Mensagem de cobrança
        </Text>

        <CampoTexto
          rotulo="Texto enviado no WhatsApp"
          valor={template}
          aoMudar={setTemplate}
          multilinha
          maiusculaInicial="sentences"
        />

        <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>
          Você pode usar: {VARIAVEIS_COBRANCA.map((v) => `{${v}}`).join(' · ')}
        </Text>

        <Cartao estilo={{ backgroundColor: tema.cores.superficieAfundada, gap: tema.espaco.xs }}>
          <Text
            style={{
              fontSize: tema.fonte.micro,
              color: tema.cores.textoSecundario,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            Como vai ficar
          </Text>
          <Text style={{ fontSize: tema.fonte.corpo, color: tema.cores.texto, lineHeight: 24 }}>
            {previa}
          </Text>
        </Cartao>

        {template !== TEMPLATE_COBRANCA_PADRAO && (
          <Botao
            titulo="Voltar ao texto padrão"
            variante="texto"
            aoTocar={() => setTemplate(TEMPLATE_COBRANCA_PADRAO)}
          />
        )}
      </View>

      <Botao titulo="Salvar" principal aoTocar={salvar} />

      <View style={{ gap: tema.espaco.md }}>
        <Text
          style={{
            fontSize: tema.fonte.pequeno,
            fontWeight: tema.peso.forte,
            color: tema.cores.textoSecundario,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
          Seus dados
        </Text>

        <Botao
          titulo="Backup e restauração"
          variante="secundario"
          aoTocar={() => router.push('/backup')}
        />
        <Botao
          titulo="Trava do app"
          variante="secundario"
          aoTocar={() => router.push('/seguranca')}
        />
      </View>

      <Text
        style={{
          fontSize: tema.fonte.micro,
          color: tema.cores.textoFraco,
          textAlign: 'center',
          lineHeight: 20,
        }}>
        Tudo neste app fica salvo só no seu aparelho. Nada é enviado para a internet.
      </Text>
    </ScrollView>
  );
}
