import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

/**
 * Consulta que se atualiza sozinha quando o banco muda.
 *
 * SUBSTITUI O `useLiveQuery` DO DRIZZLE, e o motivo e um defeito silencioso que
 * so aparece com o app na mao.
 *
 * O `useLiveQuery` escuta UMA tabela: a do `FROM`. O codigo dele e literalmente
 *
 *     const entity = query.config.table;
 *     if (config.name === tableName) refetch();
 *
 * Isso funciona para "lista de vendas desta venda". Nao funciona para saldo. O
 * saldo e calculado com subconsulta correlacionada — `venda` e `pagamento`
 * aparecem so como texto SQL dentro do `sql\`...\``, nunca como tabela do
 * Drizzle. Resultado: a consulta declara depender apenas de `cliente`, e lancar
 * um fiado NAO a invalida.
 *
 * O sintoma nao e um erro. E o "Total a receber" continuar em R$ 0,00 depois de
 * o comerciante lancar R$ 42,50 — o numero principal do app, errado, sem aviso
 * nenhum, ate a tela ser remontada. Num app de caderneta e o pior defeito
 * possivel.
 *
 * Aqui as tabelas sao declaradas explicitamente por quem chama. E chato de
 * proposito: escrever a lista obriga a pensar em quais tabelas a consulta le de
 * verdade, inclusive as que estao escondidas dentro de SQL cru.
 */
export function useConsultaViva<T>(
  consulta: PromiseLike<T[]>,
  /** Toda tabela lida pela consulta, INCLUSIVE dentro de `sql` cru. */
  tabelas: readonly string[],
  deps: unknown[] = []
): { data: T[]; erro: Error | undefined } {
  const [data, setData] = useState<T[]>([]);
  const [erro, setErro] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Evita gravar estado depois que a tela saiu: o listener pode disparar a
    // consulta e a resposta chegar com o componente ja desmontado.
    let ativo = true;

    const buscar = () => {
      consulta.then(
        (linhas) => {
          if (ativo) setData(linhas);
        },
        (falha: unknown) => {
          if (ativo) setErro(falha instanceof Error ? falha : new Error(String(falha)));
        }
      );
    };

    buscar();

    const inscricao = addDatabaseChangeListener(({ tableName }) => {
      if (tabelas.includes(tableName)) buscar();
    });

    return () => {
      ativo = false;
      inscricao.remove();
    };
    // `tabelas` fica fora das dependencias de proposito: e sempre uma constante
    // de modulo, e incluir o array recriaria o listener a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, erro };
}
