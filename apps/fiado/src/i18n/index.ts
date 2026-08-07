/**
 * Configuracao de internacionalizacao.
 *
 * Idiomas suportados: pt (default), en, es.
 * O idioma e detectado automaticamente a partir do locale do aparelho;
 * nao ha seletor manual — seguir o aparelho e a convencao de plataforma.
 *
 * Strings dos documentos exportados (PDF, CSV, mensagem WhatsApp) NAO passam
 * por aqui: o destinatario e sempre um cliente brasileiro, entao esses textos
 * permanecem em portugues independentemente do idioma da UI.
 */
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en';
import es from './es';
import pt from './pt';

// Recursos carregados sincronamente: as traducoes sao texto puro empacotado
// com o app e nao precisam de carregamento assincrono.
const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
} as const;

/** Mapa dos codigos de locale suportados. */
const SUPORTADOS = ['pt', 'en', 'es'] as const;
type IdiomaSuportado = (typeof SUPORTADOS)[number];

/**
 * Extrai o idioma base do locale do sistema (ex: 'pt-BR' → 'pt', 'en-US' → 'en').
 * Retorna 'pt' se o locale nao for suportado.
 */
function detectarIdioma(): IdiomaSuportado {
  const locales = getLocales();
  for (const locale of locales) {
    const base = locale.languageCode as IdiomaSuportado;
    if (SUPORTADOS.includes(base)) return base;
  }
  return 'pt';
}

const idioma = detectarIdioma();

i18next.use(initReactI18next).init({
  resources,
  lng: idioma,
  fallbackLng: 'pt',
  interpolation: {
    // React ja escapa os valores; nao escapar de novo.
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18next;

/**
 * Idioma ativo no momento. Util para codigo fora de componentes React
 * (ex: gerar nome de arquivo com data localizada).
 */
export function idiomaAtivo(): IdiomaSuportado {
  return (i18next.language as IdiomaSuportado) ?? 'pt';
}
