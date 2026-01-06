CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `otp_request` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`lastRequest` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prediction` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`teamName` text NOT NULL,
	`teamTag` text NOT NULL,
	`thought` text NOT NULL,
	`userId` text NOT NULL,
	`userName` text NOT NULL,
	`timestamp` text NOT NULL,
	`isPublic` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
