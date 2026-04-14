CREATE TABLE `ai_rate_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`last_called_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
