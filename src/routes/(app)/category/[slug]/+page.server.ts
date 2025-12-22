import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

const categoryMap: Record<string, string> = {
	olahraga: 'Olahraga',
	budaya: 'Budaya',
	teknologi: 'Teknologi',
	kesehatan: 'Kesehatan',
	bencana: 'Bencana',
	lainnya: 'Lainnya'
};

// Cache category pages for 5 minutes
export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const slug = params.slug?.toLowerCase();

	if (!slug) {
		return {
			category: null,
			articles: []
		};
	}

	// Map slug to category name
	const categoryName = categoryMap[slug];

	if (!categoryName) {
		return {
			category: null,
			articles: []
		};
	}

	// Get articles with this category
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
		.where(eq(table.article.category, categoryName))
		.orderBy(desc(table.article.publishedAt || table.article.createdAt));

	// Filter only published articles (publishedAt is not null)
	const publishedArticles = allArticles.filter((article) => article.publishedAt !== null);

	// Set cache headers
	// Cache for 5 minutes, allow stale-while-revalidate for 1 hour
	setHeaders({
		'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600'
	});

	return {
		category: categoryName,
		articles: publishedArticles
	};
};

