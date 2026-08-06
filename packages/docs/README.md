# @docs — Geração de documentos e compartilhamento

Transforma dado em documento e coloca o documento na mão do cliente final.

## Responsabilidade

- Gerar PDF a partir de template HTML (`expo-print`).
- Compartilhar arquivo pelo menu nativo (`expo-sharing`).
- Abrir o WhatsApp com mensagem pré-escrita (link `wa.me`).
- Exportar CSV.
- Aplicar/remover marca d'água conforme o plano do usuário.

## Divisão interna

Mesma regra do `@repo/core`: a entrada principal é **lógica pura** e roda no
vitest em Node, sem simular React Native.

| Caminho | O que tem | Depende de nativo |
|---|---|---|
| `@repo/docs` | mensagem de cobrança, HTML dos documentos, CSV, nome de arquivo | não |
| `@repo/docs/arquivo` | renderizar o PDF, gravar e compartilhar | sim |

Quem monta o documento é testado; quem grava o arquivo depende do aparelho.

## Quem usa

| App | Uso |
|---|---|
| `orcamento` | PDF do orçamento com logo — é o produto principal |
| `fiado` | Mensagem de cobrança no WhatsApp; extrato do cliente em PDF (plano pago) |
| `veiculo` | Relatório de custos em PDF (plano pago) |

## Decisões técnicas

- **PDF é gerado localmente**, via HTML renderizado pelo `expo-print`. Nenhum
  serviço externo: mantém o app funcionando offline e o custo de operação em zero.
- **WhatsApp via `wa.me`**, não pela API oficial. Abre o app com o texto pronto,
  sem cadastro de negócio, sem aprovação da Meta, sem custo por mensagem. O usuário
  revisa e aperta enviar — o que também evita o app ser acusado de mandar mensagem
  sozinho.
- **CSV é escrito para o Excel em português**: separador `;`, valor com vírgula
  decimal e BOM no início. Nenhuma das três escolhas dá erro se estiver errada —
  o arquivo simplesmente abre como uma coluna única de texto com acento
  quebrado, e o usuário conclui que o app exporta mal.
- **O extrato soma o próprio conteúdo impresso.** O saldo do rodapé não vem da
  consulta SQL: é a soma das linhas que estão na folha. Um extrato cujo total
  discorda das linhas destrói a confiança na caderneta inteira.
- **Template HTML, não biblioteca de PDF.** Ajustar layout vira ajustar CSS, que é
  rápido de iterar. O layout do PDF do `orcamento` é o item de maior risco do
  projeto e precisa ser barato de refazer.
