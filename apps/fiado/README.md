# Fiado — Caderneta de fiado digital

**Status:** planejado · **Ordem:** 1º app a ser desenvolvido

Substitui o caderno de papel do comerciante que vende fiado.

## Público

Mercadinho, bar, salão, açougue, quitanda. Gente que hoje anota dívida de cliente
em caderno e perde dinheiro por esquecimento, letra ruim ou página arrancada.

## Proposta

Abrir o app e, em menos de dez segundos, registrar que o Seu João levou R$ 42 em
compras. Ver o saldo devedor de qualquer cliente na hora. Cobrar pelo WhatsApp sem
digitar a mensagem.

## MVP (v1)

- Cadastro de cliente: nome e telefone. Nada além disso.
- Lançamento de dívida (valor, data, descrição opcional).
- Lançamento de pagamento — total ou parcial.
- Saldo devedor por cliente, calculado automaticamente.
- Lista de clientes ordenada por quem deve mais.
- Botão de cobrança que abre o WhatsApp com a mensagem já escrita (`wa.me`).
- Total a receber consolidado na tela inicial.

## Fora do escopo da v1

Controle de produtos/estoque, múltiplos usuários, juros e multa, foto do produto,
sincronização entre aparelhos, leitura de código de barras.

## Modelo de dados

```
cliente        id · nome · telefone · criado_em
lancamento     id · cliente_id · tipo(divida|pagamento) · valor_centavos
               · descricao · data · criado_em
```

Saldo é **derivado** dos lançamentos, nunca armazenado. Evita divergência entre o
saldo salvo e o histórico.

Valores em **centavos, inteiro**. Ponto flutuante não entra em código que mexe com
dinheiro.

## Monetização

Gratuito até ~15 clientes. Acima disso, assinatura de aproximadamente R$ 9,90/mês
ou desbloqueio vitalício.

Também no plano pago: backup/restauração e exportar o histórico.

O limite é de **clientes**, não de lançamentos — quem já usa o app de verdade não
pode ser interrompido no meio do expediente.

## Risco conhecido

O comerciante precisa confiar que não vai perder a caderneta. O backup exportável
não é um recurso secundário aqui, é condição para o app ser levado a sério.
