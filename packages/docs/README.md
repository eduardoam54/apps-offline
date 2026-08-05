# @docs — Geração de documentos e compartilhamento

Transforma dado em documento e coloca o documento na mão do cliente final.

## Responsabilidade

- Gerar PDF a partir de template HTML (`expo-print`).
- Compartilhar arquivo pelo menu nativo (`expo-sharing`).
- Abrir o WhatsApp com mensagem pré-escrita (link `wa.me`).
- Exportar CSV.
- Aplicar/remover marca d'água conforme o plano do usuário.

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
- **Template HTML, não biblioteca de PDF.** Ajustar layout vira ajustar CSS, que é
  rápido de iterar. O layout do PDF do `orcamento` é o item de maior risco do
  projeto e precisa ser barato de refazer.
