CREATE TABLE `abastecimento` (
	`id` text PRIMARY KEY NOT NULL,
	`veiculo_id` text NOT NULL,
	`data` text NOT NULL,
	`km` integer NOT NULL,
	`litros_milesimos` integer NOT NULL,
	`valor_total_centavos` integer NOT NULL,
	`tanque_cheio` integer DEFAULT true NOT NULL,
	`posto` text,
	`observacao` text,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`veiculo_id`) REFERENCES `veiculo`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_abastecimento_veiculo` ON `abastecimento` (`veiculo_id`,`deletado_em`);--> statement-breakpoint
CREATE INDEX `idx_abastecimento_km` ON `abastecimento` (`veiculo_id`,`km`);--> statement-breakpoint
CREATE TABLE `lembrete` (
	`id` text PRIMARY KEY NOT NULL,
	`veiculo_id` text NOT NULL,
	`tipo` text NOT NULL,
	`descricao` text NOT NULL,
	`km_alvo` integer,
	`data_alvo` text,
	`concluido` integer DEFAULT false NOT NULL,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`veiculo_id`) REFERENCES `veiculo`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lembrete_veiculo` ON `lembrete` (`veiculo_id`,`concluido`,`deletado_em`);--> statement-breakpoint
CREATE TABLE `manutencao` (
	`id` text PRIMARY KEY NOT NULL,
	`veiculo_id` text NOT NULL,
	`data` text NOT NULL,
	`km` integer NOT NULL,
	`tipo` text NOT NULL,
	`valor_centavos` integer NOT NULL,
	`oficina` text,
	`observacao` text,
	`criado_em` text NOT NULL,
	`deletado_em` text,
	FOREIGN KEY (`veiculo_id`) REFERENCES `veiculo`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_manutencao_veiculo` ON `manutencao` (`veiculo_id`,`deletado_em`);--> statement-breakpoint
CREATE INDEX `idx_manutencao_km` ON `manutencao` (`veiculo_id`,`km`);--> statement-breakpoint
CREATE TABLE `veiculo` (
	`id` text PRIMARY KEY NOT NULL,
	`apelido` text NOT NULL,
	`placa` text,
	`marca_modelo` text,
	`km_atual` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	`deletado_em` text
);
--> statement-breakpoint
CREATE INDEX `idx_veiculo_ativo` ON `veiculo` (`deletado_em`);