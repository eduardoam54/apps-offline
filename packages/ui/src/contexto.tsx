import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { temaFiado, type Tema } from './tema';

/**
 * Tema por contexto.
 *
 * Os componentes deste pacote sao usados pelos tres apps, que so diferem na cor
 * de destaque. O contexto evita passar o tema como prop em cada componente.
 *
 * O valor padrao e o tema claro do Fiado para os componentes funcionarem mesmo
 * sem provedor — util em teste e em tela isolada, que nao tem como saber o
 * esquema de cor do aparelho de qualquer forma.
 */
const ContextoTema = createContext<Tema>(temaFiado.claro);

export function ProvedorTema({ temas, children }: { temas: { claro: Tema; escuro: Tema }; children: ReactNode }) {
  // Segue o esquema de cor do aparelho, sem seletor manual — mesma convencao
  // usada para o idioma (packages/ui e apps/fiado nao pedem preferencia, so
  // seguem a plataforma).
  const esquemaDoSistema = useColorScheme();
  const resolvido = esquemaDoSistema === 'dark' ? temas.escuro : temas.claro;
  return <ContextoTema.Provider value={resolvido}>{children}</ContextoTema.Provider>;
}

export function useTema(): Tema {
  return useContext(ContextoTema);
}
