import { mysqlTable, int, varchar, datetime } from 'drizzle-orm/mysql-core';

export const user = mysqlTable('user', {
	id: varchar('id', { length: 255 }).primaryKey(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	fullName: varchar('full_name', { length: 255 }).notNull(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	aboutMe: varchar('about_me', { length: 500 }),
	profilePicture: varchar('profile_picture', { length: 1000 }),
	age: int('age')
});

export const session = mysqlTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 255 })
		.notNull()
		.references(() => user.id),
	expiresAt: datetime('expires_at').notNull()
});

export const article = mysqlTable('article', {
	id: varchar('id', { length: 255 }).primaryKey(),
	title: varchar('title', { length: 500 }).notNull(),
	category: varchar('category', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 500 }).notNull().unique(),
	featuredImage: varchar('featured_image', { length: 1000 }),
	excerpt: varchar('excerpt', { length: 1000 }),
	content: varchar('content', { length: 10000 }).notNull(),
	authorId: varchar('author_id', { length: 255 })
		.notNull()
		.references(() => user.id),
	publishedAt: datetime('published_at'),
	views: int('views').notNull().default(0),
	createdAt: datetime('created_at').notNull(),
	updatedAt: datetime('updated_at').notNull()
});

export const comment = mysqlTable('comment', {
	id: varchar('id', { length: 255 }).primaryKey(),
	articleId: varchar('article_id', { length: 255 })
		.notNull()
		.references(() => article.id),
	userId: varchar('user_id', { length: 255 })
		.notNull()
		.references(() => user.id),
	content: varchar('content', { length: 2000 }).notNull(),
	createdAt: datetime('created_at').notNull(),
	updatedAt: datetime('updated_at').notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Article = typeof article.$inferSelect;

export type Comment = typeof comment.$inferSelect;
