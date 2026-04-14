PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_rate_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`last_called_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ai_rate_limits`("user_id", "last_called_at") SELECT "user_id", "last_called_at" FROM `ai_rate_limits`;--> statement-breakpoint
DROP TABLE `ai_rate_limits`;--> statement-breakpoint
ALTER TABLE `__new_ai_rate_limits` RENAME TO `ai_rate_limits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`song_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`bars` integer DEFAULT 8 NOT NULL,
	`extra_beats` integer DEFAULT 0 NOT NULL,
	`chord_progression` text,
	`memo` text,
	`sort_order` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sections`("id", "song_id", "type", "label", "bars", "extra_beats", "chord_progression", "memo", "sort_order", "deleted_at") SELECT "id", "song_id", "type", "label", "bars", "extra_beats", "chord_progression", "memo", "sort_order", "deleted_at" FROM `sections`;--> statement-breakpoint
DROP TABLE `sections`;--> statement-breakpoint
ALTER TABLE `__new_sections` RENAME TO `sections`;--> statement-breakpoint
CREATE INDEX `sections_song_id_idx` ON `sections` (`song_id`);--> statement-breakpoint
CREATE TABLE `__new_setlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`session_date` text,
	`venue` text,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_setlists`("id", "user_id", "title", "description", "session_date", "venue", "sort_order", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "title", "description", "session_date", "venue", "sort_order", "created_at", "updated_at", "deleted_at" FROM `setlists`;--> statement-breakpoint
DROP TABLE `setlists`;--> statement-breakpoint
ALTER TABLE `__new_setlists` RENAME TO `setlists`;--> statement-breakpoint
CREATE INDEX `setlists_user_id_idx` ON `setlists` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`bpm` integer,
	`key` text,
	`reference_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_songs`("id", "user_id", "title", "artist", "bpm", "key", "reference_url", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "title", "artist", "bpm", "key", "reference_url", "created_at", "updated_at", "deleted_at" FROM `songs`;--> statement-breakpoint
DROP TABLE `songs`;--> statement-breakpoint
ALTER TABLE `__new_songs` RENAME TO `songs`;--> statement-breakpoint
CREATE INDEX `songs_user_id_idx` ON `songs` (`user_id`);