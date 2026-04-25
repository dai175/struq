CREATE INDEX `songs_user_deleted_updated_idx` ON `songs` (`user_id`, `deleted_at`, `updated_at`);
--> statement-breakpoint
CREATE INDEX `setlists_user_deleted_sort_idx` ON `setlists` (`user_id`, `deleted_at`, `sort_order`);
--> statement-breakpoint
CREATE INDEX `sections_song_deleted_sort_idx` ON `sections` (`song_id`, `deleted_at`, `sort_order`);
--> statement-breakpoint
CREATE UNIQUE INDEX `setlist_songs_setlist_sort_unique` ON `setlist_songs` (`setlist_id`, `sort_order`);
