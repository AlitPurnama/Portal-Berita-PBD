import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		const returnUrl = url.pathname;
		throw redirect(302, `/login?redirect=${encodeURIComponent(returnUrl)}`);
	}

	// Get all articles by the current user
	const articles = await db
		.select({
			id: table.article.id,
			title: table.article.title,
			category: table.article.category,
			slug: table.article.slug,
			excerpt: table.article.excerpt,
			views: table.article.views,
			publishedAt: table.article.publishedAt,
			createdAt: table.article.createdAt
		})
		.from(table.article)
		.where(eq(table.article.authorId, locals.user.id))
		.orderBy(desc(table.article.createdAt));

	return {
		articles
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Anda harus login untuk menghapus artikel' });
		}

		const formData = await request.formData();
		const articleId = formData.get('articleId')?.toString();

		if (!articleId) {
			return fail(400, { error: 'ID artikel tidak ditemukan' });
		}

		try {
			// Get article to check ownership
			const [article] = await db
				.select()
				.from(table.article)
				.where(eq(table.article.id, articleId))
				.limit(1);

			if (!article) {
				return fail(404, { error: 'Artikel tidak ditemukan' });
			}

			// Check if user is the author
			if (article.authorId !== locals.user.id) {
				return fail(403, { error: 'Anda tidak memiliki akses untuk menghapus artikel ini' });
			}

			// Delete article
			await db.delete(table.article).where(eq(table.article.id, articleId));

			return { success: true };
		} catch (error) {
			console.error('Error deleting article:', error);
			return fail(500, { error: 'Gagal menghapus artikel. Silakan coba lagi.' });
		}
	}
};

