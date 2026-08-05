# @core — Banco de dados e domínio compartilhado

Camada de persistência dos três apps. **Não contém tela.**

## Responsabilidade

- Conexão SQLite (`expo-sqlite`) e schema em Drizzle ORM.
- Migrações versionadas.
- Repositórios: as funções que leem e gravam.
- Tipos compartilhados.
- Exportar e importar backup (arquivo JSON).
- Helpers de dinheiro e data.

## O que NÃO mora aqui

Regra de negócio específica de um app. "Cliente inadimplente há mais de 30 dias" é
conceito do `fiado` e mora no `fiado`. Aqui fica só *como* um cliente é lido e
gravado.

## Entidade compartilhada

`cliente` é usada por `fiado` e `orcamento`. É a razão principal deste pacote
existir. Cada app tem seu próprio banco — não há dado trafegando entre apps —
mas o schema e o código de acesso são os mesmos.

## Convenções

- **Dinheiro em centavos, sempre inteiro.** Nenhum `float` toca em valor monetário.
- **Datas em ISO 8601 (texto).** SQLite não tem tipo de data; texto ISO ordena
  corretamente e não sofre com fuso.
- **Nada é apagado de verdade.** Exclusão marca `deletado_em`. Comerciante que apaga
  um cliente sem querer não pode perder o histórico da dívida.
- **Saldos são derivados, nunca armazenados.** Total calculado a partir dos
  lançamentos, para o histórico e o saldo jamais divergirem.
