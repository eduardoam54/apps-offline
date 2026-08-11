/**
 * Schema do banco local (SQLite via Drizzle).
 *
 * Convencoes aplicadas em todas as tabelas:
 *   - id textual ordenavel (ver id.ts)
 *   - dinheiro em coluna `integer`, sempre centavos
 *   - datas em `text` ISO 8601
 *   - exclusao logica via `deletado_em`, nunca DELETE
 *
 * Saldo do cliente NAO existe como coluna. E sempre derivado:
 *   SUM(venda.valor_centavos) - SUM(pagamento.valor_centavos)
 * Saldo gravado diverge do historico mais cedo ou mais tarde.
 */
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const cliente = sqliteTable(
  'cliente',
  {
    id: text('id').primaryKey(),
    nome: text('nome').notNull(),
    apelido: text('apelido'),
    telefone: text('telefone'),
    fotoUri: text('foto_uri'),
    /** Teto de fiado. null = sem limite definido. */
    limiteCreditoCentavos: integer('limite_credito_centavos'),
    observacao: text('observacao'),
    criadoEm: text('criado_em').notNull(),
    atualizadoEm: text('atualizado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_cliente_nome').on(t.nome),
    index('idx_cliente_ativo').on(t.deletadoEm),
  ]
);

export const venda = sqliteTable(
  'venda',
  {
    id: text('id').primaryKey(),
    clienteId: text('cliente_id')
      .notNull()
      .references(() => cliente.id),
    /** Dia civil da venda. */
    data: text('data').notNull(),
    /**
     * Total da venda. Fonte da verdade mesmo quando ha itens: e recalculado a
     * partir deles na gravacao. Assim o calculo de saldo — a consulta mais
     * frequente do app — nunca precisa fazer JOIN com venda_item.
     */
    valorCentavos: integer('valor_centavos').notNull(),
    descricao: text('descricao'),
    /** Ultima vez que esta venda entrou numa cobranca enviada. */
    cobradoEm: text('cobrado_em'),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_venda_cliente').on(t.clienteId, t.deletadoEm),
    index('idx_venda_data').on(t.data),
  ]
);

export const vendaItem = sqliteTable(
  'venda_item',
  {
    id: text('id').primaryKey(),
    vendaId: text('venda_id')
      .notNull()
      .references(() => venda.id, { onDelete: 'cascade' }),
    descricao: text('descricao').notNull(),
    /** Quantidade em milesimos: 1,5 kg = 1500. */
    quantidadeMilesimos: integer('quantidade_milesimos').notNull().default(1000),
    valorUnitarioCentavos: integer('valor_unitario_centavos').notNull(),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [index('idx_item_venda').on(t.vendaId)]
);

export const pagamento = sqliteTable(
  'pagamento',
  {
    id: text('id').primaryKey(),
    clienteId: text('cliente_id')
      .notNull()
      .references(() => cliente.id),
    data: text('data').notNull(),
    valorCentavos: integer('valor_centavos').notNull(),
    forma: text('forma', { enum: ['dinheiro', 'pix', 'cartao', 'outro'] })
      .notNull()
      .default('dinheiro'),
    /** Preenchido quando o pagamento quita uma parcela de acordo. */
    acordoParcelaId: text('acordo_parcela_id'),
    observacao: text('observacao'),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_pagamento_cliente').on(t.clienteId, t.deletadoEm),
    index('idx_pagamento_data').on(t.data),
  ]
);

/**
 * Acordo de parcelamento.
 *
 * ATENCAO: acordo NAO lanca divida. Ele e uma releitura de divida que ja existe
 * em `venda`. Se gerasse valor proprio, o saldo do cliente dobraria. Quem mexe
 * no saldo continua sendo exclusivamente `venda` e `pagamento`.
 */
export const acordo = sqliteTable(
  'acordo',
  {
    id: text('id').primaryKey(),
    clienteId: text('cliente_id')
      .notNull()
      .references(() => cliente.id),
    valorTotalCentavos: integer('valor_total_centavos').notNull(),
    numParcelas: integer('num_parcelas').notNull(),
    status: text('status', { enum: ['ativo', 'cumprido', 'quebrado'] })
      .notNull()
      .default('ativo'),
    observacao: text('observacao'),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [index('idx_acordo_cliente').on(t.clienteId, t.status)]
);

export const acordoParcela = sqliteTable(
  'acordo_parcela',
  {
    id: text('id').primaryKey(),
    acordoId: text('acordo_id')
      .notNull()
      .references(() => acordo.id, { onDelete: 'cascade' }),
    numero: integer('numero').notNull(),
    valorCentavos: integer('valor_centavos').notNull(),
    vencimento: text('vencimento').notNull(),
    /** Dia em que foi quitada. null = em aberto. */
    pagoEm: text('pago_em'),
  },
  (t) => [
    index('idx_parcela_acordo').on(t.acordoId, t.numero),
    index('idx_parcela_vencimento').on(t.vencimento, t.pagoEm),
  ]
);

/**
 * Catalogo leve, alimentado pelo proprio uso: quanto mais o comerciante lanca
 * "pao frances", mais alto ele aparece na sugestao. Evita obrigar o cadastro
 * previo de produtos, que e exatamente a burocracia que o app promete nao ter.
 */
export const produtoFrequente = sqliteTable(
  'produto_frequente',
  {
    id: text('id').primaryKey(),
    descricao: text('descricao').notNull().unique(),
    valorPadraoCentavos: integer('valor_padrao_centavos').notNull(),
    usos: integer('usos').notNull().default(1),
    atualizadoEm: text('atualizado_em').notNull(),
  },
  (t) => [index('idx_produto_usos').on(t.usos)]
);

/**
 * Orcamento (app orcamento). Reaproveita a tabela `cliente` acima — mesma
 * entidade, banco proprio (cada app abre seu proprio arquivo SQLite).
 *
 * `totalCentavos` e recalculado a partir dos itens na gravacao, igual a
 * `venda.valorCentavos`. Nao e o "saldo derivado" do CLAUDE.md — aquela regra
 * vale para saldo corrente de cliente, nao para o total de um documento
 * fechado. "Total congelado ao aprovar" nao tem mecanismo proprio no banco:
 * os repositorios recusam editar itens quando status !== 'aberto'.
 */
export const orcamento = sqliteTable(
  'orcamento',
  {
    id: text('id').primaryKey(),
    clienteId: text('cliente_id')
      .notNull()
      .references(() => cliente.id),
    /** Sequencial, comeca em 1. */
    numero: integer('numero').notNull(),
    /** Dia civil do orcamento. */
    data: text('data').notNull(),
    status: text('status', { enum: ['aberto', 'aprovado', 'recusado'] })
      .notNull()
      .default('aberto'),
    totalCentavos: integer('total_centavos').notNull(),
    descontoCentavos: integer('desconto_centavos').notNull().default(0),
    observacoes: text('observacoes'),
    criadoEm: text('criado_em').notNull(),
    atualizadoEm: text('atualizado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_orcamento_cliente').on(t.clienteId, t.deletadoEm),
    index('idx_orcamento_status').on(t.status),
    index('idx_orcamento_data').on(t.data),
  ]
);

export const orcamentoItem = sqliteTable(
  'orcamento_item',
  {
    id: text('id').primaryKey(),
    orcamentoId: text('orcamento_id')
      .notNull()
      .references(() => orcamento.id, { onDelete: 'cascade' }),
    descricao: text('descricao').notNull(),
    /** Quantidade em milesimos: 1,5 = 1500. */
    quantidadeMilesimos: integer('quantidade_milesimos').notNull().default(1000),
    valorUnitarioCentavos: integer('valor_unitario_centavos').notNull(),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [index('idx_item_orcamento').on(t.orcamentoId)]
);

// ---------------------------------------------------------------------------
// App veiculo
// ---------------------------------------------------------------------------

/**
 * Veiculo cadastrado.
 *
 * `kmAtual` e o ultimo km registrado (pelo ultimo abastecimento ou manutencao).
 * Nao e derivado: o usuario informa o km no cadastro e o app atualiza a cada
 * lancamento. O historico de km esta nas tabelas de abastecimento e manutencao.
 */
export const veiculo = sqliteTable(
  'veiculo',
  {
    id: text('id').primaryKey(),
    apelido: text('apelido').notNull(),
    placa: text('placa'),
    marcaModelo: text('marca_modelo'),
    /** Ultimo km registrado (ou km inicial no cadastro). */
    kmAtual: integer('km_atual').notNull().default(0),
    criadoEm: text('criado_em').notNull(),
    atualizadoEm: text('atualizado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [index('idx_veiculo_ativo').on(t.deletadoEm)]
);

/**
 * Abastecimento.
 *
 * Litros em milesimos: 30,5 L = 30500. Mesmo motivo das quantidades no fiado:
 * nenhum float toca em calculo de custo. Custo por km e consumo medio sao
 * derivados — nunca gravados.
 *
 * Consumo medio so e calculado entre dois TANQUES CHEIOS consecutivos. Um
 * abastecimento parcial entra no custo total mas nao afeta o km/l — registrar
 * um parcial como cheio inflaria o consumo artificialmente.
 */
export const abastecimento = sqliteTable(
  'abastecimento',
  {
    id: text('id').primaryKey(),
    veiculoId: text('veiculo_id')
      .notNull()
      .references(() => veiculo.id),
    data: text('data').notNull(),
    km: integer('km').notNull(),
    litrosMilesimos: integer('litros_milesimos').notNull(),
    valorTotalCentavos: integer('valor_total_centavos').notNull(),
    tanqueCheio: integer('tanque_cheio', { mode: 'boolean' }).notNull().default(true),
    posto: text('posto'),
    observacao: text('observacao'),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_abastecimento_veiculo').on(t.veiculoId, t.deletadoEm),
    index('idx_abastecimento_km').on(t.veiculoId, t.km),
  ]
);

/**
 * Manutencao ou reparo.
 *
 * `tipo` e texto livre, nao enum: o profissional sabe o nome certo do servico,
 * o app nao precisa de um vocabulario fechado que vai ficar desatualizado.
 */
export const manutencao = sqliteTable(
  'manutencao',
  {
    id: text('id').primaryKey(),
    veiculoId: text('veiculo_id')
      .notNull()
      .references(() => veiculo.id),
    data: text('data').notNull(),
    km: integer('km').notNull(),
    tipo: text('tipo').notNull(),
    valorCentavos: integer('valor_centavos').notNull(),
    oficina: text('oficina'),
    observacao: text('observacao'),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [
    index('idx_manutencao_veiculo').on(t.veiculoId, t.deletadoEm),
    index('idx_manutencao_km').on(t.veiculoId, t.km),
  ]
);

/**
 * Lembrete: por km ou por data.
 *
 * Os dois tipos coexistem na mesma tabela. Um lembrete de troca de oleo e por
 * km (ex.: a cada 10.000 km). Um lembrete de IPVA e por data. A coluna que nao
 * se aplica fica null.
 */
export const lembrete = sqliteTable(
  'lembrete',
  {
    id: text('id').primaryKey(),
    veiculoId: text('veiculo_id')
      .notNull()
      .references(() => veiculo.id),
    tipo: text('tipo', { enum: ['km', 'data'] }).notNull(),
    descricao: text('descricao').notNull(),
    /** Km alvo — para lembretes do tipo 'km'. */
    kmAlvo: integer('km_alvo'),
    /** Data alvo ISO 8601 — para lembretes do tipo 'data'. */
    dataAlvo: text('data_alvo'),
    concluido: integer('concluido', { mode: 'boolean' }).notNull().default(false),
    criadoEm: text('criado_em').notNull(),
    deletadoEm: text('deletado_em'),
  },
  (t) => [index('idx_lembrete_veiculo').on(t.veiculoId, t.concluido, t.deletadoEm)]
);

/** Chave/valor para configuracao: nome da loja, template de cobranca, PIN. */
export const config = sqliteTable('config', {
  chave: text('chave').primaryKey(),
  valor: text('valor').notNull(),
  atualizadoEm: text('atualizado_em')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Cliente = typeof cliente.$inferSelect;
export type NovoCliente = typeof cliente.$inferInsert;
export type Venda = typeof venda.$inferSelect;
export type NovaVenda = typeof venda.$inferInsert;
export type VendaItem = typeof vendaItem.$inferSelect;
export type NovoVendaItem = typeof vendaItem.$inferInsert;
export type Pagamento = typeof pagamento.$inferSelect;
export type NovoPagamento = typeof pagamento.$inferInsert;
export type Acordo = typeof acordo.$inferSelect;
export type NovoAcordo = typeof acordo.$inferInsert;
export type AcordoParcela = typeof acordoParcela.$inferSelect;
export type NovaAcordoParcela = typeof acordoParcela.$inferInsert;
export type ProdutoFrequente = typeof produtoFrequente.$inferSelect;
export type FormaPagamento = Pagamento['forma'];
export type StatusAcordo = Acordo['status'];
export type Orcamento = typeof orcamento.$inferSelect;
export type NovoOrcamento = typeof orcamento.$inferInsert;
export type OrcamentoItem = typeof orcamentoItem.$inferSelect;
export type NovoOrcamentoItem = typeof orcamentoItem.$inferInsert;
export type StatusOrcamento = Orcamento['status'];
export type Veiculo = typeof veiculo.$inferSelect;
export type NovoVeiculo = typeof veiculo.$inferInsert;
export type Abastecimento = typeof abastecimento.$inferSelect;
export type NovoAbastecimento = typeof abastecimento.$inferInsert;
export type Manutencao = typeof manutencao.$inferSelect;
export type NovaManutencao = typeof manutencao.$inferInsert;
export type Lembrete = typeof lembrete.$inferSelect;
export type NovoLembrete = typeof lembrete.$inferInsert;
export type TipoLembrete = Lembrete['tipo'];
