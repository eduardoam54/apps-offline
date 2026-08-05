# Apps Offline — Monorepo

Três aplicativos mobile (Android/iOS) **offline-first**, sem cadastro, sem servidor
e sem custo de infraestrutura. Todo dado vive no SQLite do próprio aparelho.

Este documento registra a **intenção** do projeto. Nenhum código de aplicação foi
escrito ainda — a estrutura está montada e as decisões estão tomadas.

---

## Os três apps

| Pasta | App | Público | Status |
|---|---|---|---|
| `apps/fiado` | Caderneta de fiado digital | Mercadinho, bar, salão, açougue | Planejado |
| `apps/orcamento` | Orçamento / ordem de serviço em PDF | Autônomo (eletricista, encanador, montador) | Planejado |
| `apps/veiculo` | Manutenção e abastecimento de veículo | Motorista de app, dono de frota pequena | Planejado |

Cada app é publicado de forma independente nas lojas. O que eles compartilham é
código, não identidade.

---

## Por que monorepo

Os apps `fiado` e `orcamento` giram em torno da mesma entidade central — **cliente**
— e do mesmo fluxo de compartilhar um documento pelo WhatsApp. Escrever isso três
vezes seria desperdício e garantiria três comportamentos ligeiramente diferentes.

A regra adotada:

> **`packages/` guarda o que é mecânica. `apps/` guarda o que é produto.**

Se um código responde "como salvo isso no banco" ou "como desenho um botão", ele
mora em `packages/`. Se responde "o que significa um cliente estar devendo", mora
no app.

### Camadas compartilhadas

- **`packages/core`** — SQLite, schema, migrações, repositórios e tipos.
- **`packages/ui`** — tema, tipografia e componentes visuais.
- **`packages/docs`** — geração de PDF e envio pelo WhatsApp.

---

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | **Expo (React Native)** | Um código para Android e iOS; EAS CLI já instalado na máquina |
| Banco local | **expo-sqlite + Drizzle ORM** | Relacional de verdade, offline, tipado, sem servidor |
| PDF | **expo-print** | Renderiza HTML para PDF localmente, sem serviço externo |
| Compartilhar | **expo-sharing** + link `wa.me` | Abre o WhatsApp sem precisar da API oficial |
| Monetização | **RevenueCat** | Valida a compra uma vez e continua funcionando offline |

### Decisões deliberadas

- **Sem backend.** Nenhum servidor, nenhuma conta, nenhuma tela de login. É o
  principal diferencial de produto, não uma limitação técnica.
- **Sem anúncios.** Destruiriam a sensação de "sem burocracia" que é a proposta.
- **Backup é arquivo, não nuvem.** Exportar/importar um arquivo mantém o custo de
  operação em zero e o dado sob controle do usuário.

---

## Monetização

Modelo comum aos três: **freemium com desbloqueio vitalício** (compra única), ou
assinatura barata onde há uso recorrente e o app mexe com dinheiro entrando.

O paywall **nunca** bloqueia o uso básico. Ele fica em:

- exportar (PDF/CSV)
- backup e restauração
- múltiplos perfis (mais de um veículo, mais de uma empresa)
- remover o limite de quantidade

O usuário precisa conseguir usar o app de verdade antes de decidir pagar.

---

## Plataforma

**Android primeiro.** Roda no emulador já instalado, o build local é gratuito e a
Play Console cobra US$ 25 uma vez só.

O código nasce compatível com iOS desde o primeiro dia. Publicar na App Store a
partir do Windows exige EAS Build na nuvem e conta Apple Developer (US$ 99/ano) —
passo adiado até um app estar validado.

---

## Ordem de trabalho

Os três **não** serão desenvolvidos em paralelo. A sequência planejada:

1. **`fiado`** — menor MVP dos três e cria a entidade `cliente`.
2. **`orcamento`** — herda `cliente` e adiciona a geração de PDF.
3. **`veiculo`** — independente, aproveita banco e design já maduros.

O objetivo é publicar o primeiro app inteiro antes de abrir o segundo. Configuração
de build, ícone, política de privacidade e paywall são resolvidos uma vez e
reaproveitados.

---

## Ambiente

Verificado na máquina de desenvolvimento:

- Node 24.16.0 / npm 11.13.0
- Android Studio + SDK em `%LOCALAPPDATA%\Android\Sdk`
- EAS CLI instalado globalmente
- Git 2.54.0

**Pendência conhecida:** `ANDROID_HOME` não está configurado no sistema. Precisa ser
resolvido antes do primeiro build local.
