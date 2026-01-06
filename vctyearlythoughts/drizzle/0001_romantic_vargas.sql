CREATE TABLE `team_notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`teamId` text NOT NULL,
	`sent` integer DEFAULT false NOT NULL,
	`createdAt` integer
);
