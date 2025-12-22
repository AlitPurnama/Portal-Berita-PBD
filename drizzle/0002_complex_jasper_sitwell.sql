CREATE TABLE `comment` (
	`id` varchar(255) NOT NULL,
	`article_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`content` varchar(2000) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `comment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comment` ADD CONSTRAINT `comment_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment` ADD CONSTRAINT `comment_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;