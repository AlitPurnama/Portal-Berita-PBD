CREATE TABLE `article` (
	`id` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`category` varchar(255) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`featured_image` varchar(1000),
	`excerpt` varchar(1000),
	`content` varchar(10000) NOT NULL,
	`author_id` varchar(255) NOT NULL,
	`published_at` datetime,
	`views` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `article_id` PRIMARY KEY(`id`),
	CONSTRAINT `article_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `about_me` varchar(500);--> statement-breakpoint
ALTER TABLE `user` ADD `profile_picture` varchar(1000);--> statement-breakpoint
ALTER TABLE `article` ADD CONSTRAINT `article_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;