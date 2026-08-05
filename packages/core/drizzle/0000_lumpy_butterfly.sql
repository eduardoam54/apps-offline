CREATE TABLE `acordo` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`valor_total_centavos` integer NOT NULL,
	`num_parcelas` integer NOT NULL,
	`status` text DEFAULT 'ativo' NOT NULL,
	`observacao` text,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_acordo_cliente` ON `acordo` (`cliente_id`,`status`);--> statement-breakpoint
CREATE TABLE `acordo_parcela` (
	`id` text PRIMARY KEY NOT NULL,
	`acordo_id` text NOT NULL,
	`numero` integer NOT NULL,
	`valor_centavos` integer NOT NULL,
	`vencimento` text NOT NULL,
	`pago_em` text,
	FOREIGN KEY (`acordo_id`) REFERENCES `acordo`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_parcela_acordo` ON `acordo_parcela` (`acordo_id`,`numero`);--> statement-breakpoint
CREATE INDEX `idx_parcela_vencimento` ON `acordo_parcela` (`vencimento`,`pago_em`);--> statement-breakpoint
CREATE TABLE `cliente` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`apelido` text,
	`telefone` text,
	`foto_uri` text,
	`limite_credito_centavos` integer,
	`observacao` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	`deletado_em` text
);
--> statement-breakpoint
CREATE INDEX `idx_cliente_nome` ON `cliente` (`nome`);--> statement-breakpoint
CREATE INDEX `idx_cliente_ativo` ON `cliente` (`deletado_em`);--> statement-breakpoint
CREATE TABLE `config` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pagamento` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`data` text NOT NULL,
	`valor_centavos` integer NOT NULL,
	`forma` text DEFAULT 'dinheiro' NOT NULL,
	`acordo_parcela_id` text,
	`observacao` text,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pagamento_cliente` ON `pagamento` (`cliente_id`,`deletado_em`);--> statement-breakpoint
CREATE INDEX `idx_pagamento_data` ON `pagamento` (`data`);--> statement-breakpoint
CREATE TABLE `produto_frequente` (
	`id` text PRIMARY KEY NOT NULL,
	`descricao` text NOT NULL,
	`valor_padrao_centavos` integer NOT NULL,
	`usos` integer DEFAULT 1 NOT NULL,
	`atualizado_em` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produto_frequente_descricao_unique` ON `produto_frequente` (`descricao`);--> statement-breakpoint
CREATE INDEX `idx_produto_usos` ON `produto_frequente` (`usos`);--> statement-breakpoint
CREATE TABLE `venda` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`data` text NOT NULL,
	`valor_centavos` integer NOT NULL,
	`descricao` text,
	`cobrado_em` text,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_venda_cliente` ON `venda` (`cliente_id`,`deletado_em`);--> statement-breakpoint
CREATE INDEX `idx_venda_data` ON `venda` (`data`);--> statement-breakpoint
CREATE TABLE `venda_item` (
	`id` text PRIMARY KEY NOT NULL,
	`venda_id` text NOT NULL,
	`descricao` text NOT NULL,
	`quantidade_milesimos` integer DEFAULT 1000 NOT NULL,
	`valor_unitario_centavos` integer NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`venda_id`) REFERENCES `venda`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_item_venda` ON `venda_item` (`venda_id`);