import { formatarBRL } from '@repo/core';
import { marcarComoCobrado } from '@repo/core/db';
import { aplicarTemplate, linkWhatsApp, TEMPLATE_COBRANCA_PADRAO } from '@repo/docs';
import { Alert, Linking } from 'react-native';

import { db } from '@/db';

export type ClienteCobravel = {
  id: string;
  nome: string;
  telefone: string | null;
  saldoCentavos: number;
};

export type ConfigCobranca = {
  nomeDaLoja: string;
  template: string;
};

/** Monta o texto final da cobranca. Separado para a tela de ajustes pre-visualizar. */
export function montarMensagem(cliente: ClienteCobravel, config: ConfigCobranca): string {
  const template = config.template.trim() === '' ? TEMPLATE_COBRANCA_PADRAO : config.template;

  return aplicarTemplate(template, {
    cliente: primeiroNome(cliente.nome),
    valor: formatarBRL(cliente.saldoCentavos),
    loja: config.nomeDaLoja.trim() === '' ? 'nossa loja' : config.nomeDaLoja,
  });
}

/**
 * Abre o WhatsApp com a cobranca pronta.
 *
 * A mensagem NAO e enviada aqui — o WhatsApp abre com o texto preenchido e quem
 * aperta enviar e o comerciante. Isso e deliberado e nao uma limitacao tecnica.
 *
 * `cobradoEm` so e marcado depois de o WhatsApp abrir de fato. Marcar antes
 * faria o app registrar cobranca que nunca aconteceu.
 */
export async function cobrarNoWhatsApp(
  cliente: ClienteCobravel,
  config: ConfigCobranca
): Promise<boolean> {
  const link = linkWhatsApp(cliente.telefone, montarMensagem(cliente, config));

  if (link == null) {
    Alert.alert(
      'Sem telefone válido',
      `${cliente.nome} não tem um telefone que dê para usar no WhatsApp. Edite o cadastro e inclua o número com DDD.`
    );
    return false;
  }

  try {
    await Linking.openURL(link);
    await marcarComoCobrado(db, cliente.id);
    return true;
  } catch {
    Alert.alert(
      'Não deu para abrir o WhatsApp',
      'Confira se o WhatsApp está instalado neste aparelho.'
    );
    return false;
  }
}

/** "João da Silva" -> "João". Cobranca soa menos formal e mais humana. */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
