/**
 * Traducoes em Portugues (pt-BR) — idioma base do app.
 *
 * Todas as chaves definidas aqui devem existir em en.ts e es.ts.
 * Strings dos PDFs e CSVs exportados NAO passam por aqui: o destinatario
 * e sempre um cliente brasileiro, entao esses textos ficam em portugues.
 */
const pt = {
  // ---------------------------------------------------------------- tabs
  tab: {
    orcamentos: 'Orçamentos',
    clientes: 'Clientes',
    ajustes: 'Ajustes',
  },

  // ---------------------------------------------------------------- titulos das telas
  tela: {
    novoCliente: 'Novo cliente',
    cliente: 'Cliente',
    editarCliente: 'Editar cliente',
    novoOrcamento: 'Novo orçamento',
    orcamento: 'Orçamento',
    editarOrcamento: 'Editar orçamento',
    plano: 'Plano',
    travaDoApp: 'Trava do app',
    backup: 'Backup',
  },

  // ---------------------------------------------------------------- lista de orcamentos
  listaOrcamentos: {
    todos: 'Todos',
    nenhumAinda: 'Nenhum orçamento ainda',
    crie: 'Crie o primeiro orçamento para começar.',
    nadaPorAqui: 'Nada por aqui',
    novoOrcamento: 'Novo orçamento',
  },

  // ---------------------------------------------------------------- lista de clientes
  listaClientes: {
    buscar: 'Buscar por nome ou telefone',
    nenhumAinda: 'Nenhum cliente ainda',
    crie: 'Cadastre o primeiro cliente para começar a fazer orçamentos.',
    nadaEncontrado: 'Nada encontrado',
    nenhunComBusca: 'Nenhum cliente combina com "{{busca}}".',
    novoCliente: 'Novo cliente',
  },

  // ---------------------------------------------------------------- ajustes (empresa)
  ajustes: {
    nomeDaEmpresa: 'Nome da empresa',
    nomePlaceholder: 'Ex.: João Eletricista',
    telefone: 'Telefone',
    telefonePlaceholder: '(00) 00000-0000',
    documento: 'Documento (CPF ou CNPJ)',
    documentoPlaceholder: 'Opcional',
    semLogo: 'Sem logo',
    escolherLogo: 'Escolher logo',
    salvar: 'Salvar',
    exportarHistorico: 'Exportar histórico (CSV)',
    backupRestauracao: 'Backup e restauração',
    travaDoApp: 'Trava do app',
    verPlano: 'Ver plano',
    salvo: 'Salvo',
    dadosAtualizados: 'Os dados da empresa foram atualizados.',
    naoDeuSalvar: 'Não deu para salvar',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    naoDeuExportar: 'Não deu para exportar',
  },

  // ---------------------------------------------------------------- detalhe do cliente
  detalheCliente: {
    novoOrcamento: 'Novo orçamento',
    orcamentos: 'Orçamentos',
    nenhumOrcamento: 'Nenhum orçamento ainda',
    excluirCliente: 'Excluir cliente',
    excluirTitulo: 'Excluir cliente',
    excluirMensagem: 'O histórico de orçamentos fica guardado e você pode restaurar depois.',
    clienteNaoEncontrado: 'Cliente não encontrado',
    podeTerSidoExcluido: 'Ele pode ter sido excluído.',
    editar: 'Editar',
    excluir: 'Excluir',
    cancelar: 'Cancelar',
    voltar: 'Voltar',
  },

  // ---------------------------------------------------------------- novo / editar cliente
  novoCliente: {
    nomeObrigatorio: 'Nome *',
    nomeErro: 'O nome é obrigatório.',
    nomePlaceholder: 'Ex.: João Eletricista',
    apelido: 'Apelido',
    apelidoPlaceholder: 'Como você chama ele',
    telefone: 'Telefone',
    telefonePlaceholder: '(00) 00000-0000',
    observacao: 'Observação',
    observacaoPlaceholder: 'Alguma anotação sobre o cliente',
    salvarCliente: 'Salvar cliente',
    salvarAlteracoes: 'Salvar alterações',
    naoDeuSalvar: 'Não deu para salvar',
    clienteRepetido: 'Cliente repetido',
    jaExiste: 'Já existe um cliente chamado "{{nome}}". Cadastrar assim mesmo?',
    cadastrar: 'Cadastrar',
  },

  // ---------------------------------------------------------------- novo orcamento
  novoOrcamento: {
    planoGratuitoLimite: 'O plano gratuito vai até {{limite}} orçamentos por mês',
    limiteReinicia:
      'O limite reinicia todo mês. Tudo que já está no app continua funcionando normalmente — aprovar, duplicar e compartilhar não têm limite.',
    verPlanoCompleto: 'Ver o plano completo',
    cliente: 'Cliente',
    buscarCliente: 'Buscar por nome ou telefone',
    novoCliente: '+ Novo cliente',
    usarEsteCliente: 'Usar este cliente',
    trocar: '  ·  trocar',
    item: 'Item',
    itemPlaceholder: 'Ex.: instalação de tomada',
    quantidade: 'Qtd',
    valorDeCada: 'Valor de cada',
    adicionarItem: 'Adicionar item',
    desconto: 'Desconto',
    observacoes: 'Observações',
    observacoesPlaceholder: 'Condições de pagamento, prazo, garantia...',
    total: 'Total',
    criarOrcamento: 'Criar orçamento',
    naoDeuCriar: 'Não deu para criar o orçamento',
    erroDescricao: 'Digite a descrição do item.',
    erroQuantidade: 'Quantidade inválida.',
    erroValor: 'Valor inválido.',
    erroSemItens: 'Adicione pelo menos um item.',
    cada: 'cada',
    nome: 'Nome *',
    telefone: 'Telefone',
  },

  // ---------------------------------------------------------------- detalhe do orcamento
  detalheOrcamento: {
    data: 'Data:',
    desconto: 'Desconto:',
    observacoes: 'Observações',
    compartilharPdf: 'Compartilhar PDF',
    aprovar: 'Aprovar',
    recusar: 'Recusar',
    reabrir: 'Reabrir',
    duplicar: 'Duplicar orçamento',
    limitePlanoDuplicar: 'Limite do plano gratuito',
    limiteMensagem:
      'O plano gratuito vai até 3 orçamentos por mês, e duplicar cria um orçamento novo. Veja o plano completo para duplicar sem limite.',
    agoraNao: 'Agora não',
    verPlano: 'Ver plano',
    naoDeuAtualizar: 'Não deu para atualizar',
    naoDeuPdf: 'Não deu para gerar o PDF',
    naoDeuDuplicar: 'Não deu para duplicar',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    orcamentoNaoEncontrado: 'Orçamento não encontrado',
    podeTerSidoExcluido: 'Ele pode ter sido excluído.',
    editar: 'Editar',
    voltar: 'Voltar',
  },

  // ---------------------------------------------------------------- plano
  plano: {
    seuPlano: 'Seu plano',
    gratuito: 'Gratuito',
    contadorOrcamentos: '{{noMes}} de {{limite}} orçamentos criados este mês',
    cabemMais: ' · cabem mais {{restantes}}',
    oPlanoCompleto: 'O plano completo libera',
    orcamentosSemLimite: 'Orçamentos sem limite',
    orcamentosSemLimiteDesc: 'Crie quantos precisar, todo mês.',
    pdfSemMarca: "PDF sem marca d'água",
    pdfSemMarcaDesc: "O documento sai limpo, com a cara da sua empresa.",
    exportarHistorico: 'Exportar histórico em planilha',
    exportarHistoricoDesc: 'Todos os orçamentos, prontos para conferir no computador.',
    continuaGraca: 'Continua de graça, sempre',
    criarAprovarDuplicar: 'Criar, aprovar e duplicar orçamentos',
    criarAprovarDuplicarDesc: 'Dentro do limite mensal, sem restrição nenhuma.',
    compartilharWhatsApp: 'Compartilhar no WhatsApp',
    compartilharWhatsAppDesc: 'Gerar e enviar o PDF nunca fica bloqueado.',
    jaCompreiOutroCelular: 'Já comprei em outro celular',
    naoDeuCompra: 'Não deu para concluir a compra',
    naoDeuRestaurar: 'Não deu para restaurar',
    pronto: 'Pronto',
    liberado: 'Seu plano foi liberado. Obrigado!',
    planoCompletoAtivo: 'Plano completo ativo',
    descricaoPago: "Orçamentos sem limite, sem marca d'água e exportação liberada. Obrigado por sustentar o app.",
    tudoContinua: 'Tudo que já está no app continua funcionando normalmente.',
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
    pin4Erro: 'O PIN precisa ter 4 números.',
    pinDiferenteErro: 'Os dois PINs não são iguais.',
    tirarTravaTitulo: 'Tirar a trava?',
    tirarTravaMsg:
      'Qualquer pessoa que pegar o celular destravado vai poder ver os dados dos seus clientes e orçamentos.',
    tirarTravaBotao: 'Tirar trava',
  },

  // ---------------------------------------------------------------- tela de trava (pin)
  telaTrava: {
    titulo: 'App trancado',
    subtitulo: 'Digite seu PIN de 4 números',
    pinErrado: 'PIN errado. Tente de novo.',
    usarDigital: 'Usar digital',
    apagar: 'Apagar',
  },

  // ---------------------------------------------------------------- backup
  backup: {
    guardarFora: 'Guardar fora do aparelho',
    guardarForaDesc:
      'Gera um arquivo com todos os orçamentos e clientes. Mande para você mesmo no WhatsApp ou salve no Drive — é a única cópia que sobrevive se o celular for perdido.',
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
    substituirTitulo: 'Substituir os dados?',
    substituirMensagem:
      'O arquivo tem {{clientes}} {{clienteLabel}} e {{orcamentos}} {{orcamentoLabel}}.\n\nTudo que está no app agora será substituído. Uma cópia do estado atual é guardada antes.',
    substituir: 'Substituir',
    voltarParaCopia: 'Voltar para esta cópia?',
    voltarMensagem: 'Tudo que está no app agora será substituído pelo conteúdo de {{copia}}.',
    restaurado: 'Os dados foram restaurados.',
    naoDeuRestaurar: 'Não deu para restaurar',
    naoDeuExportar: 'Não deu para exportar',
    naoDeuAbrir: 'Não deu para abrir o arquivo',
    naoDeuCopiar: 'Não deu para copiar',
    arquivoInvalido: 'Arquivo inválido',
    compartilhamentoIndisponivel: 'Compartilhamento indisponível',
    aparelhoSemCompartilhar: 'Este aparelho não oferece o menu de compartilhar arquivos.',
    cliente_one: 'cliente',
    cliente_other: 'clientes',
    orcamento_one: 'orçamento',
    orcamento_other: 'orçamentos',
    pronto: 'Pronto',
    cancelar: 'Cancelar',
  },
};

export default pt;
export type Traducao = typeof pt;
