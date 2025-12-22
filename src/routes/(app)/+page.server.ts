import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// Cache homepage for 5 minutes (300 seconds)
// Homepage content doesn't change frequently, but we want fresh breaking news
export const load: PageServerLoad = async ({ setHeaders }) => {
	// Get all published articles
	const allArticles = await db
		.select({
			id: table.article.id,
			title: table.article.title,
			slug: table.article.slug,
			excerpt: table.article.excerpt,
			featuredImage: table.article.featuredImage,
			category: table.article.category,
			views: table.article.views,
			publishedAt: table.article.publishedAt,
			createdAt: table.article.createdAt,
			author: {
				username: table.user.username
			}
		})
		.from(table.article)
		.innerJoin(table.user, eq(table.article.authorId, table.user.id))
		.orderBy(desc(table.article.publishedAt || table.article.createdAt));

	// Filter only published articles (publishedAt is not null)
	const publishedArticles = allArticles.filter((article) => article.publishedAt !== null);

	// Breaking news: most recent published article
	const breakingNews = publishedArticles.length > 0 ? publishedArticles[0] : null;

	// Latest news: next 3 articles (skip breaking news)
	const latestNews = publishedArticles.slice(1, 4);

	// Get articles by category
	const categories = ['Olahraga', 'Budaya', 'Teknologi', 'Kesehatan', 'Bencana', 'Lainnya'];
	const articlesByCategory: Record<string, typeof publishedArticles> = {};

	for (const category of categories) {
		articlesByCategory[category] = publishedArticles
			.filter((article) => article.category === category)
			.slice(0, 3); // Get top 3 articles per category
	}

	// Set cache headers
	// Cache for 5 minutes, allow stale-while-revalidate for 1 hour
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600'
	});

	return {
		breakingNews,
		latestNews,
		articlesByCategory
	};
};

