# Convencoes do monorepo

Apps mobile offline-first. Nenhum servidor, nenhum cadastro, nenhuma chamada de
rede — a unica excecao prevista e a validacao inicial do RevenueCat.

## Regras que nao se negociam

**Dinheiro e inteiro em centavos.** R$ 12,50 e o numero `1250`. Nenhum `float`
toca em valor monetario. Todo calculo passa pelos helpers de
`packages/core/src/money.ts`, que sao testados. `0.1 + 0.2 !== 0.3` em ponto
flutuante, e num app de divida um centavo de divergencia entre extrato e saldo
destroi a confianca no app inteiro.

**Quantidade e inteiro em milesimos.** 1,5 kg e `1500`. Mesmo motivo.

**Saldo nunca e coluna.** E sempre derivado:
`SUM(venda.valor_centavos) - SUM(pagamento.valor_centavos)`. Saldo gravado
diverge do historico mais cedo ou mais tarde.

**Nada e apagado.** Exclusao grava `deletado_em`. Toda consulta filtra por
`isNull(deletadoEm)`. Comerciante que apaga um cliente sem querer nao pode perder
o historico da divida.

**Datas em texto ISO 8601.** Dia civil e `'AAAA-MM-DD'`; momento exato e ISO
completo. Dia civil NUNCA passa por `toISOString()` — isso converte para UTC e no
Brasil uma venda das 21h cairia no dia seguinte. Use os helpers de
`packages/core/src/date.ts`.

**Acordo nao cria divida.** Um acordo de parcelamento e uma releitura de divida
que ja existe em `venda`. Se ele lancasse valor, o saldo do cliente dobraria.
Parcela quitada gera uma linha em `pagamento`; e so isso que mexe no saldo.

## Divisao entre pacotes

`packages/*` guarda mecanica — "como leio um cliente do banco", "como desenho um
botao". `apps/*` guarda produto — "o que significa um cliente estar
inadimplente". Na duvida, se a resposta e especifica de um app, ela nao vai para
`packages/`.

- `@repo/core` — entrada principal e SO logica pura (money, date, id) e por isso
  roda no vitest sem simular React Native. O acesso ao banco fica no subcaminho
  `@repo/core/db`, que depende de modulo nativo.
- `@repo/ui` — tema e componentes.

## Armadilhas ja resolvidas (nao reintroduzir)

- **Nao ligar `disableHierarchicalLookup` no metro.config.js.** Aparece em varios
  guias de monorepo, mas impede o Metro de achar dependencias aninhadas e quebra
  o bundle logo no entry point (`@expo/metro-runtime`).
- **`babel-preset-expo` precisa ser devDependency explicita do app.** Ele vive em
  `expo/node_modules` e nao resolve a partir da raiz do workspace.
- **Workspaces sao listados um a um** na raiz. Um glob `apps/*` quebra o
  `npm install` enquanto `apps/orcamento` e `apps/veiculo` forem so README.
- **`StatusBar` nao aceita mais `backgroundColor`** com edge-to-edge (obrigatorio
  no Android 15+).

## Comandos

```
npm test              testes do @repo/core
npm run typecheck     tsc em todos os workspaces
npm run db:generate   gera migracao apos mudar o schema
npm run fiado:android sobe o app no emulador
```

Depois de qualquer mudanca em `packages/core/src/db/schema.ts`, rode
`npm run db:generate` e versione a migracao gerada.

## Estado

Fase 0 concluida. Proxima: fase 1 (cliente CRUD, lancar divida, receber
pagamento, saldo, extrato). O plano completo esta em `README.md` e nos README de
cada pasta.
