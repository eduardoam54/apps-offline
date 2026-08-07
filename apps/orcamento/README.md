# Orçamento — Orçamento e ordem de serviço em PDF

**Status:** MVP completo (fases 0–6) · **Ordem:** 2º app a ser desenvolvido

O app roda: cadastro de cliente, criar orçamento com itens, aprovar/recusar/
reabrir, duplicar, gerar PDF com logo e compartilhar, dados da empresa e o
gate de plano gratuito x pago. Falta publicar — mesmo caminho do fiado (Play
Console, build assinado, depois RevenueCat).

Transforma o orçamento que o autônomo hoje manda por mensagem de texto em um PDF
com a cara de empresa.

## Público

Eletricista, encanador, montador de móveis, manicure, técnico de informática,
freelancer em geral. Quem fecha serviço por WhatsApp e não tem papel timbrado.

## Proposta

Preencher cliente, itens e valores; gerar um PDF com a logo do profissional; mandar
no WhatsApp. O app não organiza a vida dele — ele ajuda a **fechar a venda**.

## MVP (v1) — o que já está pronto

- Dados da empresa: nome, logo, telefone, documento. Tela de ajustes.
- Cadastro de cliente (mesma entidade do app `fiado`, vinda de `packages/core`
  — mas em banco próprio: os dois apps não compartilham dados em runtime).
- Orçamento com itens: descrição, quantidade, valor unitário, total automático.
- Desconto e observações.
- Geração de PDF com a logo do profissional, com marca d'água no plano gratuito.
- Compartilhar via menu do sistema (inclui WhatsApp).
- Histórico de orçamentos com status: aberto, aprovado, recusado; filtro por status.
- Duplicar um orçamento anterior — serviço repetido é a regra, não a exceção.
- Plano gratuito (3 orçamentos/mês, PDF com marca d'água) x pago (ilimitado,
  sem marca d'água, exportar histórico em CSV).

Deliberadamente fora do MVP: trava por PIN, tela de boas-vindas (onboarding) e
i18n — nenhum dos três está no README original, e o fiado só tem os dois
primeiros porque o app dele mexe com saldo de dívida, algo que não existe aqui.

## Fora do escopo

Cobrança/pagamento dentro do app, assinatura digital do cliente, catálogo de
produtos com estoque, agenda.

## Modelo de dados

```
cliente        (compartilhado com fiado — packages/core, banco próprio)
orcamento      id · cliente_id · numero · data · status
               · total_centavos · desconto_centavos · observacoes · criado_em
orcamento_item id · orcamento_id · descricao · quantidade_milesimos
               · valor_unitario_centavos · ordem
config         chave/valor (empresa_nome, empresa_telefone, empresa_documento,
               empresa_logo_uri) — mesmo mecanismo que o fiado usa para "nome
               da loja", sem tabela `empresa` dedicada
```

Valores em centavos, inteiro. `orcamento.total_centavos` é recalculado a partir
dos itens na gravação, igual a `venda.valor_centavos` no fiado.

O **total do orçamento é congelado** quando o status vira aprovado ou recusado:
os repositórios (`packages/core/src/db/repos/orcamento.ts`) recusam editar
itens fora do status `aberto`. Reabrir libera a edição de novo.

## Monetização

Gratuito: 3 orçamentos por mês (reinicia todo mês), PDF com marca d'água
discreta do app.

Pago (assinatura ou vitalício): orçamentos ilimitados, PDF sem marca d'água,
exportar histórico em CSV.

A regra vive em `packages/core/src/plano.ts` (`podeCriarOrcamento`,
`LIMITE_ORCAMENTOS_GRATIS_MES`), testada. A licença fica em arquivo local
(`src/licenca.ts`), fora do banco e fora do backup — mesma decisão do fiado, e
pelo mesmo motivo: restaurar um backup não pode dar nem tirar o plano pago de
ninguém.

A compra em si ainda não está ligada — `src/loja.ts` é o único ponto de
encaixe do RevenueCat, e segue exatamente o mesmo contrato e os mesmos passos
documentados em `apps/fiado/src/loja.ts`. Só pode ser ligado depois do app
publicado, porque produto de compra precisa existir na Play Console primeiro.

É o app com menor resistência a pagar dos três — o PDF com logo se paga no primeiro
serviço fechado.

## Risco conhecido

O layout do PDF é o produto inteiro. Se ficar amador, o app perde o único motivo de
existir — é a parte que recebeu mais atenção (`packages/docs/src/orcamento.ts`).

## Falta para publicar

Mesmo checklist do fiado, app por app:

1. build de release assinado (`eas build`)
2. publicar em teste fechado na Play Console e criar os produtos de compra
3. ligar o RevenueCat em `src/loja.ts`

Sem cobertura de teste ainda: as telas. Os testes são de lógica pura
(`packages/core`, `packages/docs`) e banco (`packages/core/src/db/orcamento.test.ts`).
