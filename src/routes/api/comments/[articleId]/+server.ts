import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const articleId = params.articleId;

	if (!articleId) {
		throw error(400, 'Article ID is required');
	}

	// Don't cache comments API - always get fresh data
	setHeaders({
		'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0'
	});

	try {
		// Get comments for this article
		const comments = await db
			.select({
				id: table.comment.id,
				content: table.comment.content,
				createdAt: table.comment.createdAt,
				user: {
					id: table.user.id,
					username: table.user.username,
					profilePicture: table.user.profilePicture
				}
			})
			.from(table.comment)
			.innerJoin(table.user, eq(table.comment.userId, table.user.id))
			.where(eq(table.comment.articleId, articleId))
			.orderBy(desc(table.comment.createdAt));

		return json({ comments });
	} catch (err: any) {
		console.error('Error fetching comments:', err);
		throw error(500, 'Failed to fetch comments');
	}
};

