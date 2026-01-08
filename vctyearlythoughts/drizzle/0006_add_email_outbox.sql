-- Drizzle migration: add email_outbox table

CREATE TABLE IF NOT EXISTS `email_outbox` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `type` TEXT NOT NULL,
  `payload` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'pending',
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `lastError` TEXT,
  `nextRetryAt` INTEGER,
  `sentAt` INTEGER,
  `createdAt` INTEGER NOT NULL,
  `updatedAt` INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_email_outbox_status_created_at` ON `email_outbox` (`status`, `createdAt`);
