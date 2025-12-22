import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, or, like } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const query = url.searchParams.get('q')?.trim() || '';

	// Set cache headers - shorter cache for search results
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
	});

	if (!query || query.length < 2) {
		return {
			query: '',
			articles: [],
			totalResults: 0
		};
	}

	try {
		// Search in title, excerpt, and content
		// Using LIKE for case-insensitive search
		const searchPattern = `%${query}%`;

		const allArticles = await db
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
			.where(
				or(
					like(table.article.title, searchPattern),
					like(table.article.excerpt, searchPattern),
					like(table.article.content, searchPattern)
				)
			)
			.orderBy(desc(table.article.publishedAt || table.article.createdAt));

		// Filter only published articles
		const publishedArticles = allArticles.filter((article) => article.publishedAt !== null);

		return {
			query,
			articles: publishedArticles,
			totalResults: publishedArticles.length
		};
	} catch (error) {
		console.error('Error searching articles:', error);
		return {
			query,
			articles: [],
			totalResults: 0
		};
	}
};

