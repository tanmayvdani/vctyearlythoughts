CREATE TABLE `player` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`name` text,
	`alias` text NOT NULL,
	`role` text
);
--> statement-breakpoint
CREATE INDEX `player_team_id_idx` ON `player` (`teamId`);--> statement-breakpoint
CREATE TABLE `team_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`date` text NOT NULL,
	`action` text NOT NULL,
	`playerAlias` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transaction_team_id_idx` ON `team_transaction` (`teamId`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `team_transaction` (`date`);