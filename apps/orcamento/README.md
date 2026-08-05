# Orçamento — Orçamento e ordem de serviço em PDF

**Status:** planejado · **Ordem:** 2º app a ser desenvolvido

Transforma o orçamento que o autônomo hoje manda por mensagem de texto em um PDF
com a cara de empresa.

## Público

Eletricista, encanador, montador de móveis, manicure, técnico de informática,
freelancer em geral. Quem fecha serviço por WhatsApp e não tem papel timbrado.

## Proposta

Preencher cliente, itens e valores; gerar um PDF com a logo do profissional; mandar
no WhatsApp. O app não organiza a vida dele — ele ajuda a **fechar a venda**.

## MVP (v1)

- Dados da empresa: nome, logo, telefone, documento. Preenchido uma vez.
- Cadastro de cliente (mesma entidade do app `fiado`, vinda de `packages/core`).
- Orçamento com itens: descrição, quantidade, valor unitário, total automático.
- Desconto e observações.
- Geração de PDF com a logo do profissional.
- Compartilhar direto no WhatsApp.
- Histórico de orçamentos com status: aberto, aprovado, recusado.
- Duplicar um orçamento anterior — serviço repetido é a regra, não a exceção.

## Fora do escopo da v1

Nota fiscal e integração fiscal, cobrança/pagamento dentro do app, assinatura
digital do cliente, catálogo de produtos com estoque, agenda.

## Modelo de dados

```
empresa        id · nome · logo_uri · telefone · documento
cliente        (compartilhado com fiado — packages/core)
orcamento      id · cliente_id · numero · data · status
               · desconto_centavos · observacoes · criado_em
orcamento_item id · orcamento_id · descricao · quantidade
               · valor_unitario_centavos · ordem
```

Valores em centavos, inteiro.

O **total do orçamento é congelado** quando o status vira aprovado. Um orçamento
enviado ao cliente não pode mudar de valor depois só porque um item foi editado.

## Monetização

Gratuito: 3 orçamentos por mês, PDF com marca d'água discreta do app.

Pago (assinatura ou vitalício): orçamentos ilimitados, logo própria, PDF sem marca
d'água, exportar histórico.

É o app com menor resistência a pagar dos três — o PDF com logo se paga no primeiro
serviço fechado.

## Risco conhecido

O layout do PDF é o produto inteiro. Se ficar amador, o app perde o único motivo de
existir. É a parte que merece mais tempo, e é por isso que este app vem **depois**
do `fiado` — a base de dados e o design já vêm prontos.
