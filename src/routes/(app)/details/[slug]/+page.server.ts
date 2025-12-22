import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { encodeBase64url } from '@oslojs/encoding';
import { randomBytes } from 'node:crypto';

// Cache detail pages for 2 minutes (shorter because view counter updates)
// But allow stale-while-revalidate for better performance
export const load: PageServerLoad = async ({ params, setHeaders, locals }) => {
	const slug = params.slug;

	if (!slug) {
		throw error(404, 'Artikel tidak ditemukan');
	}

	// Get article with author info
	const [article] = await db
		.select({
			article: table.article,
			author: {
				id: table.user.id,
				username: table.user.username,
				fullName: table.user.fullName,
				aboutMe: table.user.aboutMe,
				profilePicture: table.user.profilePicture
			}
		})
		.from(table.article)
		.innerJoin(table.user, eq(table.article.authorId, table.user.id))
		.where(eq(table.article.slug, slug))
		.limit(1);

	if (!article) {
		throw error(404, 'Artikel tidak ditemukan');
	}

	// Check if this device has already viewed this article
	// We'll check this in the client-side, but we need to prepare the article ID
	const articleId = article.article.id;

	// Set cache headers
	// For authenticated users, use short cache to ensure user data is fresh but not too aggressive
	// For anonymous users, use public cache
	if (locals.user) {
		setHeaders({
			'Cache-Control': 'private, max-age=30, must-revalidate',
			'X-Article-Id': article.article.id // Add article ID to headers for client-side use
		});
	} else {
		setHeaders({
			'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=600',
			'X-Article-Id': article.article.id // Add article ID to headers for client-side use
		});
	}

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
		.where(eq(table.comment.articleId, article.article.id))
		.orderBy(desc(table.comment.createdAt));

	// Get related articles (same category, excluding current article, limit 3)
	const relatedArticles = await db
		.select({
			id: table.article.id,
			title: table.article.title,
			slug: table.article.slug,
			excerpt: table.article.excerpt,
			featuredImage: table.article.featuredImage,
			views: table.article.views,
			publishedAt: table.article.publishedAt,
			createdAt: table.article.createdAt,
			author: {
				username: table.user.username
			}
		})
		.from(table.article)
		.innerJoin(table.user, eq(table.article.authorId, table.user.id))
		.where(eq(table.article.category, article.article.category))
		.orderBy(desc(table.article.publishedAt || table.article.createdAt))
		.limit(4); // Get 4, then filter out current article

	// Filter out current article and only published articles
	const filteredRelated = relatedArticles
		.filter((a) => a.id !== article.article.id && a.publishedAt !== null)
		.slice(0, 3);

	return {
		article: article.article,
		author: article.author,
		comments,
		relatedArticles: filteredRelated,
		user: locals.user, // Pass current user for comment form (always fresh from hooks)
		articleId // Pass article ID for view tracking
	};
};

export const actions: Actions = {
	postComment: async ({ request, params, locals, url }) => {
		// Check if user is logged in
		if (!locals.user) {
			// Redirect to login with return URL
			const returnUrl = url.pathname;
			throw redirect(302, `/login?redirect=${encodeURIComponent(returnUrl)}`);
		}

		const slug = params.slug;
		if (!slug) {
			return fail(400, { error: 'Slug artikel tidak valid' });
		}

		// Get article
		const [articleData] = await db
			.select()
			.from(table.article)
			.where(eq(table.article.slug, slug))
			.limit(1);

		if (!articleData) {
			return fail(404, { error: 'Artikel tidak ditemukan' });
		}

		const formData = await request.formData();
		const content = formData.get('comment')?.toString();

		if (!content || content.trim().length === 0) {
			return fail(400, { error: 'Komentar tidak boleh kosong' });
		}

		if (content.length > 2000) {
			return fail(400, { error: 'Komentar terlalu panjang. Maksimal 2000 karakter.' });
		}

		try {
			const commentId = encodeBase64url(randomBytes(18));
			const now = new Date();

			await db.insert(table.comment).values({
				id: commentId,
				articleId: articleData.id,
				userId: locals.user.id,
				content: content.trim(),
				createdAt: now,
				updatedAt: now
			});

			return { success: true };
		} catch (error: any) {
			console.error('Error posting comment:', error);
			return fail(500, { error: 'Gagal memposting komentar. Silakan coba lagi.' });
		}
	}
};

