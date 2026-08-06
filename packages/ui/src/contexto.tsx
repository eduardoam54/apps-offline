import { createContext, useContext, type ReactNode } from 'react';

import { temaFiado, type Tema } from './tema';

/**
 * Tema por contexto.
 *
 * Os componentes deste pacote sao usados pelos tres apps, que so diferem na cor
 * de destaque. O contexto evita passar o tema como prop em cada componente.
 *
 * O valor padrao e o tema do Fiado para os componentes funcionarem mesmo sem
 * provedor — util em teste e em tela isolada.
 */
const ContextoTema = createContext<Tema>(temaFiado);

export function ProvedorTema({ tema, children }: { tema: Tema; children: ReactNode }) {
  return <ContextoTema.Provider value={tema}>{children}</ContextoTema.Provider>;
}

export function useTema(): Tema {
  return useContext(ContextoTema);
}
