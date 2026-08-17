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
- `@repo/docs` — mesma divisao: a entrada principal monta texto (mensagem de
  cobranca, HTML dos documentos, CSV) e e testavel em Node puro; gerar o PDF e
  gravar arquivo ficam em `@repo/docs/arquivo`, que usa expo-print e
  expo-sharing.
- `@repo/ui` — tema e componentes.

## Armadilhas ja resolvidas (nao reintroduzir)

- **Saldo se calcula com subconsulta correlacionada, nunca com JOIN.** `LEFT JOIN
  venda` + `LEFT JOIN pagamento` na mesma consulta faz produto cartesiano e infla
  o saldo sem dar erro.
- **Na correlacao, escreva `cliente.id` como texto SQL — nao `${cliente.id}`.** Ao
  executar, o Drizzle renderiza a coluna interpolada sem qualificar a tabela: vira
  so `"id"`, que dentro da subconsulta casa com `venda.id`. A condicao fica
  `v.cliente_id = v.id`, nunca verdadeira, e o saldo da zero em tudo. O `toSQL()`
  mostra a versao qualificada e esconde o problema — so teste contra banco real
  pega isso.
- **`useLiveQuery` do Drizzle nao serve para saldo — use `useConsultaViva`.** O
  hook do Drizzle escuta UMA tabela, a do `FROM`. Como o saldo sai de subconsulta
  correlacionada, `venda` e `pagamento` existem so como texto SQL e a consulta
  declara depender apenas de `cliente`: lancar um fiado nao invalidava nada e o
  "Total a receber" ficava em R$ 0,00 ate a tela ser remontada. O
  `useConsultaViva` (`packages/core/src/db/viva.ts`) recebe a lista de tabelas
  explicitamente. Consulta nova que toque em saldo passa `TABELAS_DO_SALDO`.
- **Licenca nao mora na tabela `config`.** A `config` viaja dentro do backup, de
  proposito. Se o plano morasse la, restaurar o backup de um conhecido daria o
  plano pago de graca — e, pior, restaurar um backup antigo TIRARIA o plano de
  quem pagou. Ela fica num arquivo em `Paths.document`, fora do banco.
- **CSV brasileiro usa `;` e precisa de BOM.** O Excel separa colunas pelo
  separador de lista do idioma do sistema, que em pt-BR e ponto e virgula: com
  virgula, a planilha inteira cai numa coluna so. Sem BOM no inicio, ele le como
  ANSI e todo acento vira lixo. Nenhum dos dois da erro — so produz um arquivo
  que o usuario culpa o app por gerar.
- **PDF nao pode depender de recurso externo.** O `expo-print` renderiza o HTML
  num WebView do aparelho. Fonte de CDN ou imagem por URL nao carrega — o app e
  offline — e o documento sai torto justamente para quem esta sem internet.
- **`typedRoutes` fica desligado.** Em monorepo o gerador lista arquivos de codigo
  como rota (ate `saldo.test`) e ao mesmo tempo perde rotas de verdade, quebrando
  o typecheck inteiro.

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

### Build Android — o que ja mordeu

`apps/fiado/android` e gerado pelo prebuild e NAO e versionado. Todo ajuste feito
la dentro se perde no proximo `expo prebuild --clean`.

- **O heap padrao do Gradle nao da conta.** O template vem com
  `org.gradle.jvmargs=-Xmx2048m` e o D8 morre com `OutOfMemoryError` no merge das
  dex, num erro que parece problema de codigo e nao e. Ja resolvido pelo plugin
  `plugins/withHeapDoGradle.js`, que reaplica `-Xmx3584m` a cada prebuild — nao
  edite `gradle.properties` na mao.
- **Desligue o emulador antes de compilar.** Numa maquina de 16 GB o emulador
  sozinho leva a memoria livre para ~1 GB e o build falha por falta dela.
- **`edgeToEdgeEnabled` saiu do app.json.** O Android 16 torna edge-to-edge
  obrigatorio e o plugin agora avisa que a chave nao existe mais.
- **Emulador novo pode subir em modo aviao e sem Wi-Fi.** Ai o bundle nao carrega
  e a tela vermelha diz so "Unable to load script". Conferir com
  `adb shell settings get global airplane_mode_on` e `adb shell svc wifi enable`.

Depois de qualquer mudanca em `packages/core/src/db/schema.ts`, rode
`npm run db:generate` e versione a migracao gerada.

## Estado

Os tres apps do monorepo tem MVP completo. `fiado` foi o primeiro e e o mais
maduro; `orcamento` e `veiculo` repetem a mesma mecanica de `packages/core` e
`packages/ui`, cada um com seu proprio banco e regras de produto.

### `apps/fiado` — caderneta de fiado digital

Fases 0 a 8 concluidas, mais uma fase 8b:

| Fase | O que entrou |
|---|---|
| 0 | fundacao: expo-router, banco, tema |
| 1 | cliente, lancar divida, receber pagamento, saldo, extrato |
| 2 | cobranca por WhatsApp, alertas, ajustes |
| 3 | itens da venda, produtos frequentes |
| 4 | acordo de parcelamento, limite de credito |
| 5 | backup, restauracao, trava por PIN |
| 6 | exportar extrato e relatorio em PDF, planilhas em CSV |
| 7 | plano gratuito x pago: limite de clientes, gate de exportar, tela de plano |
| 8 | boas-vindas, icone proprio, eas.json, politica de privacidade |
| 8b | i18n (pt/en/es, segue o idioma do aparelho) e redesign visual de `packages/ui`: dark mode completo, cards com profundidade sutil, estado de foco em campos, icones contextuais |

O paywall esta inteiro EXCETO a compra: `apps/fiado/src/loja.ts` e o unico ponto
de encaixe do RevenueCat e hoje reporta "compra indisponivel". Ele so pode ser
ligado depois de o app ser publicado, porque produto de compra precisa existir
na Play Console primeiro. O arquivo lista os passos na ordem.

A politica de privacidade ja esta hospedada:
`https://eduardoam54.github.io/apps-offline/` (fonte em `docs/index.html` na
raiz do repo, servida por GitHub Pages a partir de `main`).

Falta para publicar, e cada um depende de uma decisao ou conta sua:

1. ~~hospedar a `POLITICA-DE-PRIVACIDADE.md` numa URL publica~~ — feito
2. conta na Play Console (US$ 25) e build de release assinado (`eas build`)
3. publicar em teste fechado e criar os produtos de compra
4. so entao o RevenueCat, preenchendo `src/loja.ts`

### `apps/orcamento` — orcamento e ordem de servico em PDF

MVP completo (fases 0-6): cadastro de cliente, orcamento com itens, aprovar/
recusar/reabrir, duplicar, PDF com logo, dados da empresa, plano gratuito x
pago. Ganhou depois backup/restauracao, i18n e trava por PIN/biometria
(mesmo mecanismo do fiado). Falta publicar — mesmo caminho do fiado.

### `apps/veiculo` — manutencao e abastecimento de veiculo

MVP completo (fases 0-6): cadastro de veiculo, abastecimento com calculo de
consumo (km/l) e custo por km, manutencoes, alertas por quilometragem e por
data. Terceiro app do monorepo, mesma mecanica de `packages/core`/`packages/ui`.
Falta publicar.

### Dividido entre sessoes

Varias frentes deste projeto rodam em sessoes paralelas do Claude Code no
mesmo working directory. Antes de assumir que o `git log`/estado do disco bate
com o que uma conversa lembra, vale conferir `git log --oneline -10` — trabalho
relevante pode ter entrado por fora da conversa atual.

Sem cobertura de teste automatizado nas telas de nenhum dos tres apps. Os
testes sao de logica pura e banco (`packages/core`, `packages/docs`) — bugs de
tela (ex.: o bug do saldo do fiado, o tab bar sem `backgroundColor` no dark
mode) so aparecem rodando o app no emulador.

O plano completo esta em `README.md` e nos README de cada pasta.
