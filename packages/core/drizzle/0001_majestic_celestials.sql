CREATE TABLE `orcamento` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`numero` integer NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'aberto' NOT NULL,
	`total_centavos` integer NOT NULL,
	`desconto_centavos` integer DEFAULT 0 NOT NULL,
	`observacoes` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_orcamento_cliente` ON `orcamento` (`cliente_id`,`deletado_em`);--> statement-breakpoint
CREATE INDEX `idx_orcamento_status` ON `orcamento` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orcamento_data` ON `orcamento` (`data`);--> statement-breakpoint
CREATE TABLE `orcamento_item` (
	`id` text PRIMARY KEY NOT NULL,
	`orcamento_id` text NOT NULL,
	`descricao` text NOT NULL,
	`quantidade_milesimos` integer DEFAULT 1000 NOT NULL,
	`valor_unitario_centavos` integer NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`orcamento_id`) REFERENCES `orcamento`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_item_orcamento` ON `orcamento_item` (`orcamento_id`);