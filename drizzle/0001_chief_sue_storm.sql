PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_setlist_songs` (
	`setlist_id` text NOT NULL,
	`song_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	PRIMARY KEY(`setlist_id`, `song_id`),
	FOREIGN KEY (`setlist_id`) REFERENCES `setlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_setlist_songs`("setlist_id", "song_id", "sort_order") SELECT "setlist_id", "song_id", "sort_order" FROM `setlist_songs`;--> statement-breakpoint
DROP TABLE `setlist_songs`;--> statement-breakpoint
ALTER TABLE `__new_setlist_songs` RENAME TO `setlist_songs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `sections_song_id_idx` ON `sections` (`song_id`);--> statement-breakpoint
CREATE INDEX `setlists_user_id_idx` ON `setlists` (`user_id`);--> statement-breakpoint
CREATE INDEX `songs_user_id_idx` ON `songs` (`user_id`);