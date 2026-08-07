/**
 * Traducoes em Portugues (pt-BR) — idioma base do app.
 *
 * Todas as chaves definidas aqui devem existir em en.ts e es.ts.
 * Strings dos documentos exportados (PDF, CSV, WhatsApp) ficam em
 * packages/docs e NAO sao traduzidos: o destinatario e sempre brasileiro.
 */
const pt = {
  // ---------------------------------------------------------------- tabs
  tab: {
    inicio: 'Início',
    clientes: 'Clientes',
    ajustes: 'Ajustes',
  },

  // ---------------------------------------------------------------- _layout (titulos das telas)
  tela: {
    novoCliente: 'Novo cliente',
    cliente: 'Cliente',
    editarCliente: 'Editar cliente',
    lancamento: 'Lançamento',
    lanciarFiado: 'Lançar fiado',
    receberPagamento: 'Receber pagamento',
    cobrarClientes: 'Cobrar clientes',
    parcelarDivida: 'Parcelar dívida',
    acordo: 'Acordo',
    exportar: 'Exportar',
    plano: 'Plano',
    backup: 'Backup',
    travaDoApp: 'Trava do app',
  },

  // ---------------------------------------------------------------- comum
  comum: {
    salvar: 'Salvar',
    cancelar: 'Cancelar',
    voltar: 'Voltar',
    editar: 'Editar',
    arquivar: 'Arquivar',
    restaurar: 'Restaurar',
    pronto: 'Pronto',
    erro: 'Erro',
    nome: 'Nome',
    telefone: 'Telefone',
    observacao: 'Observação',
    sim: 'Sim',
    nao: 'Não',
    valorMaiorZero: 'Digite um valor maior que zero.',
  },

  // ---------------------------------------------------------------- boas-vindas
  boasVindas: {
    titulo: 'Sua caderneta digital',
    descricao:
      'Anote o fiado, veja quem está devendo e cobre pelo WhatsApp. Tudo fica salvo só no seu aparelho — sem cadastro, sem mensalidade para começar e funcionando sem internet.',
    nomeDaSuaLoja: 'Nome da sua loja',
    nomePlaceholder: 'Ex.: Mercadinho do Zé',
    nomeHint:
      'É o nome que aparece na cobrança que você manda no WhatsApp e no extrato em PDF. Dá para mudar depois em Ajustes.',
    seuTelefone: 'Seu telefone (opcional)',
    telefonePlaceholder: '(00) 00000-0000',
    comecar: 'Começar',
    depoisPreencho: 'Depois eu preencho',
  },

  // ---------------------------------------------------------------- inicio
  inicio: {
    totalAReceber: 'Total a receber',
    recebidoEsteMes: 'Recebido este mês:',
    quemMaisDeve: 'Quem mais deve',
    clientes: 'Clientes',
    ninguemDevendo: 'Ninguém devendo no momento',
    cobrarWhatsApp: 'Cobrar no WhatsApp ({{count}})',
    verTodosClientes: 'Ver todos os {{count}} clientes',
    cadastrarCliente: 'Cadastrar cliente',
    cadernetaVazia: 'Sua caderneta está vazia',
    primeiroCadastro: 'Cadastre o primeiro cliente para começar a anotar o fiado.',
    // resumo do cartao
    nenhumClienteCadastrado: 'Nenhum cliente cadastrado',
    ninguemDevendoResumo_one: '{{count}} cliente · ninguém devendo',
    ninguemDevendoResumo_other: '{{count}} clientes · ninguém devendo',
    clientesDevendo_one: '{{devendo}} de {{count}} cliente devendo',
    clientesDevendo_other: '{{devendo}} de {{count}} clientes devendo',
    // alertas
    parcelasVencidas_one: '1 parcela de acordo vencida',
    parcelasVencidas_other: '{{count}} parcelas de acordo vencidas',
    clientePassouLimite_one: '1 cliente passou do limite',
    clientePassouLimite_other: '{{count}} clientes passaram do limite',
    semPagarHaDias_one: '1 cliente sem pagar há mais de {{days}} dias',
    semPagarHaDias_other: '{{count}} clientes sem pagar há mais de {{days}} dias',
  },

  // ---------------------------------------------------------------- clientes
  clientes: {
    buscar: 'Buscar por nome ou telefone',
    todos: 'Todos',
    devendo: 'Devendo ({{count}})',
    nenhumClienteAinda: 'Nenhum cliente ainda',
    primeiroCadastro: 'Cadastre o primeiro cliente para começar a anotar o fiado.',
    nadaEncontrado: 'Nada encontrado',
    nenhunComBusca: 'Nenhum cliente combina com "{{busca}}".',
    ninguemDevendoMomento: 'Ninguém está devendo no momento.',
    novoCliente: 'Novo cliente',
    // aviso de limite
    planoGratuitoCheio: 'Plano gratuito cheio ({{limite}} clientes)',
    cabemMais_one: 'Cabe mais {{count}} cliente no plano gratuito',
    cabemMais_other: 'Cabem mais {{count}} clientes no plano gratuito',
    toquePlanoCompleto: 'Toque para ver o plano completo.',
  },

  // ---------------------------------------------------------------- detalhe do cliente
  detalheCliente: {
    creditoAFavor: 'Crédito a favor',
    deve: 'Deve',
    passou: 'Passou do limite de {{limite}}',
    lancarFiado: 'Lançar fiado',
    receber: 'Receber',
    cobrarSemTelefone: 'Cobrar (sem telefone)',
    cobrarWhatsApp: 'Cobrar no WhatsApp',
    parcelarDivida: 'Parcelar a dívida',
    acordoEmAndamento: 'Acordo em andamento',
    toqueParcelas: 'Toque para ver as parcelas',
    extrato: 'Extrato',
    nenhumLancamento: 'Nenhum lançamento ainda',
    extratoEmPdf: 'Extrato em PDF',
    arquivarCliente: 'Arquivar cliente',
    // extrato linhas
    fiado: 'Fiado',
    pagamento: 'Pagamento',
    item_one: '{{count}} item',
    item_other: '{{count}} itens',
    // formas de pagamento
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao: 'Cartão',
    outro: 'Outro',
    // alertas
    clienteNaoEncontrado: 'Cliente não encontrado',
    podeTerSidoArquivado: 'Ele pode ter sido arquivado.',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    naoDeuExtratoErro: 'Não deu para gerar o extrato',
    // arquivar
    arquivarTitulo: 'Arquivar cliente',
    arquivarComDivida:
      '{{nome}} ainda deve {{valor}}. Arquivar tira essa dívida do total a receber, mas o histórico fica guardado.',
    arquivarSemDivida: 'O histórico fica guardado e você pode reativar depois.',
  },

  // ---------------------------------------------------------------- novo cliente
  novoCliente: {
    nomeObrigatorio: 'Nome *',
    nomeErro: 'O nome é obrigatório.',
    nomePlaceholder: 'Ex.: João da Silva',
    apelido: 'Apelido',
    apelidoPlaceholder: 'Como você chama ele',
    telefone: 'Telefone',
    telefonePlaceholder: '(00) 00000-0000',
    limiteFiado: 'Limite de fiado',
    limitePlaceholder: 'Deixe vazio para não ter limite',
    limiteHint: 'O app avisa quando o cliente passar desse valor. Ele continua podendo comprar.',
    observacao: 'Observação',
    observacaoPlaceholder: 'Alguma anotação sobre o cliente',
    salvarCliente: 'Salvar cliente',
    naoDeuSalvar: 'Não deu para salvar',
    // cliente repetido
    clienteRepetido: 'Cliente repetido',
    jaExiste: 'Já existe um cliente chamado "{{nome}}". Cadastrar assim mesmo?',
    cadastrar: 'Cadastrar',
    // paywall
    planoGratuitoLimite: 'O plano gratuito vai até {{limite}} clientes',
    voceJaTem: 'Você já tem {{count}}. Tudo que está anotado continua funcionando normalmente — lançar, receber, cobrar e fazer backup não têm limite.',
    verPlanoCompleto: 'Ver o plano completo',
    arquivarSugestao:
      'Se preferir, arquive um cliente que não compra mais: arquivar abre vaga e o histórico dele fica guardado.',
  },

  // ---------------------------------------------------------------- nova venda
  novaVenda: {
    deveAtual: '{{nome}} · deve {{valor}}',
    valorDoFiado: 'Valor do fiado',
    totalDosItens: 'Total dos itens',
    detalharOQueLevou: 'Detalhar o que levou',
    produto: 'Produto',
    produtoPlaceholder: 'Ex.: pão francês',
    quantidade: 'Qtd',
    valorDeCada: 'Valor de cada',
    adicionarItem: 'Adicionar item',
    removerItem: 'Remover {{nome}}',
    cada: 'cada',
    lancarFiado: 'Lançar fiado',
    observacao: 'Observação (opcional)',
    observacaoPlaceholder: 'Alguma anotação sobre esta compra',
    data: 'Data:',
    novoSaldo: 'Novo saldo:',
    naoDeuLancar: 'Não deu para lançar',
    // erros
    digiteNomeProduto: 'Digite o nome do produto.',
    quantidadeInvalida: 'Quantidade inválida.',
    valorProdutoInvalido: 'Valor do produto inválido.',
    // alerta de limite
    vaiPassarDoLimite: 'Vai passar do limite',
    saldoVaiPara:
      'O saldo vai para {{futuro}}, acima do limite de {{limite}}. Você pode lançar assim mesmo.',
  },

  // ---------------------------------------------------------------- novo pagamento
  novoPagamento: {
    deveAtual: '{{nome}} · deve {{valor}}',
    proximaParcela: 'Próxima parcela do acordo',
    recebiEstaParcela: 'Recebi esta parcela',
    ouOutroValor: 'Ou outro valor',
    valorRecebido: 'Valor recebido',
    quitarTudo: 'Quitar tudo ({{valor}})',
    formaDePagamento: 'Forma de pagamento',
    registrarPagamento: 'Registrar pagamento',
    naoDeuRegistrar: 'Não deu para registrar',
    // resultado
    aindaVaiDever: 'Ainda vai dever {{valor}}',
    ficaQuite: 'Fica quite',
    ficaCredito: 'Fica com {{valor}} de crédito',
    // formas
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao: 'Cartão',
    outro: 'Outro',
    // parcela
    venceEm: 'Vence em {{data}}',
  },

  // ---------------------------------------------------------------- cobranca em lote
  cobrancaLote: {
    cobradosHoje: '{{cobrados}} de {{total}} cobrados hoje',
    whatsAppPronto: 'O WhatsApp abre com a mensagem pronta. Você revisa e envia.',
    semTelefone_one: '{{count}} cliente sem telefone cadastrado.',
    semTelefone_other: '{{count}} clientes sem telefone cadastrado.',
    ninguemDevendo: 'Ninguém devendo',
    semCobranca: 'Não há cobrança para fazer no momento.',
    cobrarDeNovo: 'Cobrar de novo',
    cobrar: 'Cobrar',
    cobradoHoje: 'Cobrado hoje',
    semTelefoneLabel: 'Sem telefone',
  },

  // ---------------------------------------------------------------- ajustes
  ajustes: {
    suaLoja: 'Sua loja',
    nomeDaLoja: 'Nome da loja',
    nomePlaceholder: 'Ex.: Mercadinho do Zé',
    telefone: 'Telefone',
    telefonePlaceholder: '(00) 00000-0000',
    mensagemCobranca: 'Mensagem de cobrança',
    textoWhatsApp: 'Texto enviado no WhatsApp',
    variaveis: 'Você pode usar: {{vars}}',
    comoVaiFicar: 'Como vai ficar',
    voltarTextoPadrao: 'Voltar ao texto padrão',
    salvar: 'Salvar',
    seusDados: 'Seus dados',
    exportarRelatorios: 'Exportar relatórios e planilhas',
    backupRestauracao: 'Backup e restauração',
    travaDoApp: 'Trava do app',
    plano: 'Plano',
    planoCompleto: 'Plano completo ativo',
    verPlanoCompleto: 'Ver o plano completo',
    privacidade: 'Tudo neste app fica salvo só no seu aparelho. Nada é enviado para a internet.',
  },

  // ---------------------------------------------------------------- exportar
  exportar: {
    paywallTitulo: 'Exportar faz parte do plano completo',
    paywallTexto:
      'Backup e restauração continuam de graça — exportar é para levar o histórico para fora do app, em documento ou planilha.',
    documentoPdf: 'Documento em PDF',
    pdfDescricao:
      'Gera a lista de quem está devendo, com telefone e data da última compra. É para você — imprimir, guardar ou mandar para quem cuida do caixa.',
    relatorioDevedores: 'Relatório de quem está devendo',
    planilhaComputador: 'Planilha para o computador',
    planilhaDescricao:
      'Abre no Excel, no Google Planilhas ou no LibreOffice. Serve para somar, filtrar e conferir com calma fora do balcão.',
    todosLancamentos: 'Todos os lançamentos',
    listaClientesSaldos: 'Lista de clientes e saldos',
    extratoNota: 'O extrato de um cliente sai pela tela dele, no botão "Extrato em PDF".',
    exportarNaoBackup:
      'Exportar não é backup: o arquivo serve para ler e conferir, mas não volta para dentro do app. Para poder restaurar a caderneta, use Backup.',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    naoDeuExportar: 'Não deu para exportar',
  },

  // ---------------------------------------------------------------- plano
  plano: {
    seuPlano: 'Seu plano',
    gratuito: 'Gratuito',
    contadorClientes: '{{ativos}} de {{limite}} clientes cadastrados',
    cabemMais: ' · cabem mais {{vagas}}',
    oPlanoCompleto: 'O plano completo libera',
    clientesSemLimite: 'Clientes sem limite',
    clientesSemLimiteDesc: 'Cadastre quantos precisar.',
    exportarPdf: 'Exportar em PDF e planilha',
    exportarPdfDesc: 'Extrato do cliente, relatório de quem deve e as planilhas para o computador.',
    continuaGraca: 'Continua de graça, sempre',
    lancarReceberCobrar: 'Lançar, receber e cobrar',
    lancarReceberCobrarDesc: 'Sem limite de lançamentos. O app nunca para no meio do expediente.',
    backupRestauracao: 'Backup e restauração',
    backupRestauracaoDesc:
      'Guardar e recuperar a caderneta não é recurso pago. Seus dados são seus.',
    jaCompreiOutroCelular: 'Já comprei em outro celular',
    naoDeuCompra: 'Não deu para concluir a compra',
    naoDeuRestaurar: 'Não deu para restaurar',
    pronto: 'Pronto',
    liberado: 'Seu plano foi liberado. Obrigado!',
    // plano pago
    planoCompletoAtivo: 'Plano completo ativo',
    clientesIlimitados: 'Clientes sem limite e exportação liberada. Obrigado por sustentar o app.',
    // loja indisponivel
    tudoContinua: 'Tudo que já está no app continua funcionando normalmente.',
  },

  // ---------------------------------------------------------------- backup
  backup: {
    guardarFora: 'Guardar fora do aparelho',
    guardarForaDesc:
      'Gera um arquivo com a caderneta inteira. Mande para você mesmo no WhatsApp ou salve no Drive — é a única cópia que sobrevive se o celular for perdido.',
    exportarBackup: 'Exportar backup',
    restaurarArquivo: 'Restaurar de um arquivo',
    restaurarArquivoDesc:
      'Substitui tudo que está no app pelo conteúdo do arquivo. Você confere o que vem antes de confirmar.',
    escolherArquivo: 'Escolher arquivo',
    copiasAutomaticas: 'Cópias automáticas no aparelho',
    copiasAutomaticasDesc:
      'O app guarda as {{n}} últimas cópias sozinho, uma por dia. Elas protegem contra apagar algo sem querer — mas ficam no próprio celular, então não substituem o backup exportado.',
    ultimaCopia: 'Última cópia: {{data}}',
    nenhumaCopia: 'Nenhuma cópia ainda',
    copia_one: '{{count}} cópia guardada',
    copia_other: '{{count}} cópias guardadas',
    copiarAgora: 'Copiar agora',
    restaurar: 'Restaurar',
    // dialogs
    substituirTitulo: 'Substituir a caderneta?',
    substituirMensagem:
      'O arquivo tem {{clientes}} {{clienteLabel}}, {{lancamentos}} {{lancamentoLabel}} e {{pagamentos}} {{pagamentoLabel}}.\n\nTudo que está no app agora será substituído. Uma cópia do estado atual é guardada antes.',
    substituir: 'Substituir',
    voltarParaCopia: 'Voltar para esta cópia?',
    voltarMensagem:
      'Tudo que está no app agora será substituído pelo conteúdo de {{copia}}.',
    restaurado: 'A caderneta foi restaurada.',
    naoDeuRestaurar: 'Não deu para restaurar',
    naoDeuExportar: 'Não deu para exportar',
    naoDeuAbrir: 'Não deu para abrir o arquivo',
    naoDeuCopiar: 'Não deu para copiar',
    arquivoInvalido: 'Arquivo inválido',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    cliente_one: 'cliente',
    cliente_other: 'clientes',
    lancamento_one: 'lançamento',
    lancamento_other: 'lançamentos',
    pagamento_one: 'pagamento',
    pagamento_other: 'pagamentos',
  },

  // ---------------------------------------------------------------- seguranca / trava
  seguranca: {
    descricao:
      'Com a trava ligada, o app pede o PIN toda vez que é aberto ou volta do segundo plano.',
    criarPin: 'Criar PIN',
    pin4Numeros: 'PIN de 4 números',
    digiteDeNovo: 'Digite de novo',
    pinAnotarAviso:
      'Anote o PIN em algum lugar seguro. Ele não pode ser recuperado — se esquecer, só restaurando um backup.',
    salvarPin: 'Salvar PIN',
    cancelar: 'Cancelar',
    travaLigada: 'Trava ligada',
    appPedePinAoAbrir: 'O app pede o PIN ao abrir.',
    desbloquearDigital: 'Desbloquear com digital',
    maisRapidoQuePin: 'Mais rápido que digitar o PIN',
    trocarPin: 'Trocar PIN',
    tirarATrava: 'Tirar a trava',
    voltar: 'Voltar',
    // validacao
    pin4Erro: 'O PIN precisa ter 4 números.',
    pinDiferenteErro: 'Os dois PINs não são iguais.',
    // dialogo
    tirarTravaTitulo: 'Tirar a trava?',
    tirarTravaMsg:
      'Qualquer pessoa que pegar o celular destravado vai poder ver quanto cada cliente deve.',
    tirarTravaBotao: 'Tirar trava',
  },

  // ---------------------------------------------------------------- tela de trava (pin)
  telaTrava: {
    titulo: 'Caderneta trancada',
    subtitulo: 'Digite seu PIN de 4 números',
    pinErrado: 'PIN errado. Tente de novo.',
    tentarBiometria: 'Usar digital',
    apagar: 'Apagar',
  },

  // ---------------------------------------------------------------- acordo
  acordo: {
    // novo acordo — campos e opcoes
    parcelamento: 'Parcelamento',
    dividaAtual: 'Dívida atual',
    numeroDeParcelas: 'Número de parcelas',
    numeroDe2a24: 'de 2 a 24',
    primeiroVencimento: 'Primeiro vencimento',
    criarAcordo: 'Criar acordo',
    resumoAcordo: '{{parcelas}}x de {{valor}} — primeiro vence em {{data}}',
    naoDeuCriarAcordo: 'Não deu para criar o acordo',
    // opcoes de periodicidade
    mensal: 'Mensal',
    quinzenal: 'Quinzenal',
    semanal: 'Semanal',
    // opcoes de primeiro vencimento
    em7Dias: 'Em 7 dias',
    em15Dias: 'Em 15 dias',
    em30Dias: 'Em 30 dias',
    // cabecalho do cliente
    deveAtual: '{{nome}} · deve {{valor}}',
    // aviso de acordo duplo
    acordoAtivoAviso: 'Este cliente já tem um acordo em andamento. Criar outro não cancela o anterior.',
    // rotulos dos campos
    valorAParcelar: 'Valor a parcelar',
    emQuantasVezes: 'Em quantas vezes',
    primeiroVencimentoHint: 'Vence em {{data}}',
    aCadaQuantoTempo: 'A cada quanto tempo',
    comoVaiFicar: 'Como vai ficar',
    parcelarNaoMuda: 'Parcelar não muda o quanto o cliente deve — só organiza como ele vai pagar.',
    // validacao
    valorInvalido: 'Valor inválido',
    digiteQuanto: 'Digite quanto será parcelado.',
    // detalhe do acordo — status
    acordoNaoEncontrado: 'Acordo não encontrado',
    cumprido: 'Acordo cumprido',
    cancelado: 'Acordo cancelado',
    emAndamento: 'Acordo em andamento',
    // detalhe do acordo — resumo financeiro
    parcelasPagas: '{{pagas}} de {{total}} parcelas pagas',
    faltaPagar: 'Falta {{valor}}',
    // detalhe do acordo — linhas de parcela
    parcela: 'Parcela {{n}}',
    venceEm: 'Vence em {{data}}',
    paga: 'Paga',
    pagaEm: 'Paga em {{data}}',
    venceuHa_one: 'Venceu há {{count}} dia',
    venceuHa_other: 'Venceu há {{count}} dias',
    // detalhe do acordo — acoes
    recebi: 'Recebi',
    confirmarQuitacaoMsg: 'Registrar o recebimento de {{valor}}?',
    naoDeuRegistrar: 'Não deu para registrar',
    cancelarAcordo: 'Cancelar o acordo',
    cancelarAcordoMsg: 'O que o cliente já pagou continua abatido. Cancelar só significa que o combinado deixou de valer.',
    cancelarAcordoBotao: 'Cancelar acordo',
    // acordos antigos (mantidos por compatibilidade de tipo)
    quitarParcela: 'Quitar esta parcela',
    encerrarAcordo: 'Encerrar acordo',
    quitarPorPagamento: 'Quitar pelo pagamento',
    acordoQuitado: 'Acordo quitado',
    todosQuitados: 'Todas as parcelas foram pagas.',
    encerrarTitulo: 'Encerrar acordo?',
    encerrarMsg: 'As parcelas restantes serão marcadas como encerradas. O saldo continua em aberto.',
    encerrar: 'Encerrar',
    naoDeuQuitar: 'Não deu para quitar',
    naoDeuEncerrar: 'Não deu para encerrar',
  },

  // ---------------------------------------------------------------- venda (detalhe)
  detalheVenda: {
    lancamentoNaoEncontrado: 'Lançamento não encontrado',
    fiadoDe: 'Fiado de {{data}}',
    fiado: 'Fiado',
    data: 'Data:',
    descricao: 'Descrição',
    itens: 'Itens',
    total: 'Total',
    excluir: 'Excluir lançamento',
    excluirTitulo: 'Excluir lançamento',
    excluirMsg:
      'O valor sai do saldo do cliente. O registro continua guardado no aparelho.',
    excluirBotao: 'Excluir',
    naoDeuExcluir: 'Não deu para excluir',
  },

  // ---------------------------------------------------------------- editar cliente
  editarCliente: {
    nome: 'Nome *',
    nomePlaceholder: 'Ex.: João da Silva',
    nomeErro: 'O nome é obrigatório.',
    apelido: 'Apelido',
    apelidoPlaceholder: 'Como você chama ele',
    telefone: 'Telefone',
    telefonePlaceholder: '(00) 00000-0000',
    limiteFiado: 'Limite de fiado',
    limitePlaceholder: 'Deixe vazio para não ter limite',
    limiteHint: 'O app avisa quando o cliente passar desse valor.',
    observacao: 'Observação',
    observacaoPlaceholder: 'Alguma anotação sobre o cliente',
    salvar: 'Salvar alterações',
    naoDeuSalvar: 'Não deu para salvar',
  },
};

export default pt;
export type Traducao = typeof pt;
