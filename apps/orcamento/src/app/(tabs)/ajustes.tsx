import { recursoLiberado } from '@repo/core';
import { consultaOrcamentos, gravarConfig, useConsultaViva } from '@repo/core/db';
import { Botao, CampoTexto, Cartao, useTema } from '@repo/ui';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { db } from '@/db';
import { exportarOrcamentosEmCsv } from '@/exportar';
import { CHAVES_EMPRESA, useEmpresa } from '@/hooks/useEmpresa';
import { useLicenca } from '@/licenca';

/**
 * Dados da empresa: nome, logo, telefone, documento. Aparecem no cabecalho do
 * PDF do orcamento — e o que faz o documento parecer vindo de uma empresa, e
 * nao de uma mensagem avulsa de WhatsApp.
 *
 * Guardados na tabela `config` (mesmo padrao do fiado para "nome da loja"), e
 * NAO numa tabela `empresa` a parte: e so um punhado de campos, e reusar o
 * mecanismo generico existente evita duplicar codigo por uma diferenca que nao
 * compensa.
 */
export default function TelaAjustes() {
  const tema = useTema();
  const { t } = useTranslation();
  const empresa = useEmpresa();
  const plano = useLicenca((e) => e.plano);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [logoUri, setLogoUri] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  type LinhaOrcamento = {
    numero: number;
    clienteNome: string;
    data: string;
    status: 'aberto' | 'aprovado' | 'recusado';
    totalCentavos: number;
  };
  const { data: orcamentos } = useConsultaViva(consultaOrcamentos(db), ['orcamento'], []);

  async function exportarCsv() {
    if (!recursoLiberado('exportar', plano)) {
      router.push('/plano');
      return;
    }

    setExportando(true);
    try {
      const linhas = (orcamentos ?? []) as LinhaOrcamento[];
      const compartilhou = await exportarOrcamentosEmCsv(
        linhas.map((o) => ({
          numero: o.numero,
          cliente: o.clienteNome,
          data: o.data,
          status: o.status,
          totalCentavos: o.totalCentavos,
        }))
      );
      if (!compartilhou) {
        Alert.alert(t('ajustes.compartilhamentoIndisponivel'), t('ajustes.aparelhoSemCompartilhar'));
      }
    } catch (falha) {
      Alert.alert(t('ajustes.naoDeuExportar'), String(falha));
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    if (!empresa.carregado) return;
    setNome(empresa.nome);
    setTelefone(empresa.telefone);
    setDocumento(empresa.documento);
    setLogoUri(empresa.logoUri);
  }, [empresa.carregado, empresa.nome, empresa.telefone, empresa.documento, empresa.logoUri]);

  async function escolherLogo() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (resultado.canceled) return;

    const escolhida = resultado.assets[0];
    if (escolhida == null) return;

    // Copia para um arquivo permanente e com nome fixo: a galeria do sistema
    // pode apagar o original a qualquer momento, e o app precisa continuar
    // enxergando a logo depois de fechado e reaberto.
    const extensao = escolhida.uri.split('.').pop() ?? 'jpg';
    const destino = new File(Paths.document, `logo-empresa.${extensao}`);
    if (destino.exists) destino.delete();
    new File(escolhida.uri).copySync(destino);

    setLogoUri(destino.uri);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await Promise.all([
        gravarConfig(db, CHAVES_EMPRESA.nome, nome.trim()),
        gravarConfig(db, CHAVES_EMPRESA.telefone, telefone.trim()),
        gravarConfig(db, CHAVES_EMPRESA.documento, documento.trim()),
        gravarConfig(db, CHAVES_EMPRESA.logoUri, logoUri),
      ]);
      Alert.alert(t('ajustes.salvo'), t('ajustes.dadosAtualizados'));
    } catch (falha) {
      Alert.alert(t('ajustes.naoDeuSalvar'), String(falha));
    } finally {
      setSalvando(false);
    }
  }

  if (!empresa.carregado) return null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: tema.espaco.lg, gap: tema.espaco.lg }}
      keyboardShouldPersistTaps="handled">
      <Cartao estilo={{ gap: tema.espaco.md, alignItems: 'center' }}>
        {logoUri !== '' ? (
          <Image
            source={{ uri: logoUri }}
            style={{ width: 96, height: 96, borderRadius: tema.raio.md }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: tema.raio.md,
              backgroundColor: tema.cores.superficieAfundada,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: tema.fonte.micro, color: tema.cores.textoFraco }}>{t("ajustes.semLogo")}</Text>
          </View>
        )}
        <Botao titulo={t("ajustes.escolherLogo")} variante="secundario" aoTocar={escolherLogo} />
      </Cartao>

      <CampoTexto
        rotulo={t("ajustes.nomeDaEmpresa")}
        valor={nome}
        aoMudar={setNome}
        espacoReservado={t("ajustes.nomePlaceholder")}
      />

      <CampoTexto
        rotulo={t("ajustes.telefone")}
        valor={telefone}
        aoMudar={setTelefone}
        espacoReservado={t("ajustes.telefonePlaceholder")}
        tipoTeclado="phone-pad"
        maiusculaInicial="none"
      />

      <CampoTexto
        rotulo={t("ajustes.documento")}
        valor={documento}
        aoMudar={setDocumento}
        espacoReservado={t("ajustes.documentoPlaceholder")}
        tipoTeclado="numeric"
        maiusculaInicial="none"
      />

      <Botao titulo={t("ajustes.salvar")} principal carregando={salvando} aoTocar={salvar} />

      <Botao
        titulo={t("ajustes.exportarHistorico")}
        variante="secundario"
        carregando={exportando}
        aoTocar={exportarCsv}
      />

      <Botao
        titulo={t("ajustes.backupRestauracao")}
        variante="secundario"
        aoTocar={() => router.push('/backup')}
      />

      <Botao
        titulo={t("ajustes.travaDoApp")}
        variante="secundario"
        aoTocar={() => router.push('/seguranca')}
      />

      <Botao titulo={t("ajustes.verPlano")} variante="texto" aoTocar={() => router.push('/plano')} />
    </ScrollView>
  );
}
