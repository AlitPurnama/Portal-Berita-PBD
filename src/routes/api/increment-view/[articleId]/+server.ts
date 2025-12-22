import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
	const articleId = params.articleId;

	if (!articleId) {
		throw error(400, 'Article ID is required');
	}

	try {
		// Get current views
		const [article] = await db
			.select({ views: table.article.views })
			.from(table.article)
			.where(eq(table.article.id, articleId))
			.limit(1);

		if (!article) {
			throw error(404, 'Article not found');
		}

		// Increment view counter
		await db
			.update(table.article)
			.set({ views: (article.views || 0) + 1 })
			.where(eq(table.article.id, articleId));

		return json({ success: true });
	} catch (err: any) {
		console.error('Error incrementing view counter:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to increment view counter');
	}
};

