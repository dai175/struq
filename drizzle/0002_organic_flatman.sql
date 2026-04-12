PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sections`("id", "song_id", "type", "label", "bars", "extra_beats", "chord_progression", "memo", "sort_order", "deleted_at") SELECT "id", "song_id", "type", "label", "bars", "extra_beats", "chord_progression", "memo", "sort_order", "deleted_at" FROM `sections`;--> statement-breakpoint
DROP TABLE `sections`;--> statement-breakpoint
ALTER TABLE `__new_sections` RENAME TO `sections`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `sections_song_id_idx` ON `sections` (`song_id`);