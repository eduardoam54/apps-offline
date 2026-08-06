/**
 * Cobranca por WhatsApp.
 *
 * Usa link `wa.me`, e nao a API oficial da Meta. Tres razoes:
 *
 *   - nao exige cadastro de conta comercial nem aprovacao
 *   - nao custa por mensagem
 *   - a mensagem abre no WhatsApp do proprio comerciante para ele revisar e
 *     apertar enviar
 *
 * O ultimo ponto e o mais importante: o app nunca manda mensagem sozinho. Quem
 * cobra e o dono da caderneta, com o numero dele, na conversa dele. Um app que
 * dispara cobranca automatica seria denunciado na loja no primeiro mes.
 */

/**
 * Converte um telefone brasileiro para o formato do wa.me (so digitos, com DDI).
 *
 * O cuidado nao obvio esta no DDD 55 (Santa Maria e regiao, no RS). Um numero
 * `55 99999-9999` comeca com "55" sem ter codigo de pais, e prefixar cegamente
 * quem comeca com 55 geraria um numero invalido. Por isso a decisao e pelo
 * COMPRIMENTO, nao pelo prefixo:
 *
 *   10 ou 11 digitos  -> numero nacional, falta o DDI
 *   12 ou 13 digitos  -> ja vem com o 55 do Brasil na frente
 */
export function paraFormatoWhatsApp(telefone: string | null | undefined): string | null {
  if (telefone == null) return null;

  const digitos = telefone.replace(/\D/g, '');

  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }

  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    return digitos;
  }

  return null;
}

/** Monta a URL do wa.me. Devolve null se o telefone nao serve. */
export function linkWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  const numero = paraFormatoWhatsApp(telefone);
  if (numero == null) return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Substitui as variaveis do template.
 *
 * Variavel desconhecida vira string vazia em vez de aparecer crua na mensagem:
 * o comerciante pode ter digitado `{nome}` em vez de `{cliente}`, e mandar
 * "Oi {nome}" para o cliente seria pior do que mandar "Oi".
 */
export function aplicarTemplate(template: string, variaveis: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_completo, chave: string) => variaveis[chave] ?? '');
}

/** Variaveis que o template de cobranca aceita. */
export const VARIAVEIS_COBRANCA = ['cliente', 'valor', 'loja'] as const;

export const TEMPLATE_COBRANCA_PADRAO =
  'Oi {cliente}, tudo bem? Passando pra lembrar do fiado aqui na {loja}. ' +
  'Está em {valor}. Quando puder acertar, agradeço!';
