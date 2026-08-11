/**
 * Configuracao de internacionalizacao do app orcamento.
 *
 * Idiomas suportados: pt (default), en, es.
 * O idioma e detectado automaticamente a partir do locale do aparelho.
 *
 * Strings dos PDFs e CSVs exportados NAO passam por aqui: o destinatario e
 * sempre um cliente brasileiro, entao esses textos ficam em portugues
 * independentemente do idioma da UI.
 */
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en';
import es from './es';
import pt from './pt';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
} as const;

const SUPORTADOS = ['pt', 'en', 'es'] as const;
type IdiomaSuportado = (typeof SUPORTADOS)[number];

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
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18next;
