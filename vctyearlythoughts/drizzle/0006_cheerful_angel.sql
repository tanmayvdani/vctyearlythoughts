CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`userName` text NOT NULL,
	`userImage` text,
	`predictionId` text NOT NULL,
	`parentId` text,
	`content` text NOT NULL,
	`voteScore` integer DEFAULT 0 NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`predictionId`) REFERENCES `prediction`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comment_prediction_idx` ON `comment` (`predictionId`);--> statement-breakpoint
CREATE INDEX `comment_parent_idx` ON `comment` (`parentId`);--> statement-breakpoint
CREATE TABLE `email_change_request` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`newEmail` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`createdAt` integer
);
--> statement-breakpoint
CREATE INDEX `email_change_user_idx` ON `email_change_request` (`userId`);--> statement-breakpoint
CREATE INDEX `email_change_token_idx` ON `email_change_request` (`token`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lastError` text,
	`nextRetryAt` integer,
	`sentAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX `status_created_at_idx` ON `email_outbox` (`status`,`createdAt`);--> statement-breakpoint
CREATE TABLE `vote` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`predictionId` text,
	`commentId` text,
	`value` integer NOT NULL,
	`createdAt` integer,
	FOREIGN KEY (`predictionId`) REFERENCES `prediction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commentId`) REFERENCES `comment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_prediction_vote_unique` ON `vote` (`userId`,`predictionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_comment_vote_unique` ON `vote` (`userId`,`commentId`);--> statement-breakpoint
DROP TABLE `allowed_tester`;--> statement-breakpoint
ALTER TABLE `prediction` ADD `voteScore` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `prediction` ADD `commentCount` integer DEFAULT 0 NOT NULL;