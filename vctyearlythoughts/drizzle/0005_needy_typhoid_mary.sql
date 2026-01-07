CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag` text NOT NULL,
	`region` text NOT NULL,
	`index` integer NOT NULL,
	`roster` text,
	`transactions` text
);
--> statement-breakpoint
ALTER TABLE `prediction` ADD `masters1Placement` text;--> statement-breakpoint
ALTER TABLE `prediction` ADD `masters2Placement` text;--> statement-breakpoint
ALTER TABLE `prediction` ADD `championsPlacement` text;