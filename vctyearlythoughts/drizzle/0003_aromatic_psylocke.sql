CREATE TABLE `allowed_tester` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_tester_email_unique` ON `allowed_tester` (`email`);--> statement-breakpoint
CREATE TABLE `region_notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`regionName` text NOT NULL,
	`sent` integer DEFAULT false NOT NULL,
	`createdAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_region_unique` ON `region_notification` (`userId`,`regionName`);--> statement-breakpoint
ALTER TABLE `prediction` ADD `kickoffPlacement` text;--> statement-breakpoint
ALTER TABLE `prediction` ADD `stage1Placement` text;--> statement-breakpoint
ALTER TABLE `prediction` ADD `stage2Placement` text;--> statement-breakpoint
ALTER TABLE `prediction` ADD `rosterMoves` text;--> statement-breakpoint
CREATE INDEX `public_time_idx` ON `prediction` (`isPublic`,`timestamp`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_team_unique` ON `team_notification` (`userId`,`teamId`);