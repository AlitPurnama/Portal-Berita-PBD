import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateSlug } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) {
		const returnUrl = url.pathname;
		throw redirect(302, `/login?redirect=${encodeURIComponent(returnUrl)}`);
	}

	const slug = params.slug;

	if (!slug) {
		throw error(404, 'Artikel tidak ditemukan');
	}

	// Get article
	const [article] = await db
		.select()
		.from(table.article)
		.where(eq(table.article.slug, slug))
		.limit(1);

	if (!article) {
		throw error(404, 'Artikel tidak ditemukan');
	}

	// Check if user is the author
	if (article.authorId !== locals.user.id) {
		throw error(403, 'Anda tidak memiliki akses untuk mengedit artikel ini');
	}

	return {
		article
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) {
			return { error: 'Anda harus login untuk mengupdate artikel' };
		}

		const slug = params.slug;
		if (!slug) {
			return { error: 'Slug tidak ditemukan' };
		}

		// Get existing article
		const [existingArticle] = await db
			.select()
			.from(table.article)
			.where(eq(table.article.slug, slug))
			.limit(1);

		if (!existingArticle) {
			return { error: 'Artikel tidak ditemukan' };
		}

		// Check if user is the author
		if (existingArticle.authorId !== locals.user.id) {
			return { error: 'Anda tidak memiliki akses untuk mengedit artikel ini' };
		}

		const formData = await request.formData();
		const judul = formData.get('judul')?.toString();
		const kategori = formData.get('kategori')?.toString();
		const tanggal = formData.get('tanggal')?.toString();
		const gambar = formData.get('gambar')?.toString();
		const excerpt = formData.get('excerpt')?.toString();
		const konten = formData.get('konten')?.toString();

		// Validasi
		const validCategories = ['Olahraga', 'Budaya', 'Teknologi', 'Kesehatan', 'Bencana', 'Lainnya'];

		if (!judul || !kategori || !konten) {
			return { error: 'Judul, kategori, dan konten wajib diisi' };
		}

		if (judul.length < 5) {
			return { error: 'Judul harus minimal 5 karakter' };
		}

		if (!validCategories.includes(kategori)) {
			return { error: 'Kategori tidak valid' };
		}

		if (konten.length < 50) {
			return { error: 'Konten harus minimal 50 karakter' };
		}

		try {
			// Generate new slug if title changed
			let newSlug = existingArticle.slug;
			if (judul !== existingArticle.title) {
				newSlug = generateSlug(judul);
				let baseSlug = newSlug;
				let counter = 1;

				// Check if slug already exists (excluding current article)
				while (true) {
					const [existing] = await db
						.select()
						.from(table.article)
						.where(eq(table.article.slug, newSlug))
						.limit(1);

					if (!existing || existing.id === existingArticle.id) break;
					newSlug = `${baseSlug}-${counter}`;
					counter++;
				}
			}

			// Parse tanggal
			let publishedAt: Date | null = existingArticle.publishedAt;
			if (tanggal) {
				publishedAt = new Date(tanggal);
			}

			// Update article
			const now = new Date();
			await db
				.update(table.article)
				.set({
					title: judul,
					category: kategori,
					slug: newSlug,
					featuredImage: gambar || null,
					excerpt: excerpt || null,
					content: konten,
					publishedAt: publishedAt,
					updatedAt: now
				})
				.where(eq(table.article.id, existingArticle.id));

			// Redirect ke halaman artikel yang sudah diupdate
			throw redirect(302, `/details/${newSlug}`);
		} catch (error: any) {
			if (error.status === 302) {
				throw error; // Re-throw redirect
			}
			console.error('Error updating article:', error);
			return { error: 'Gagal mengupdate artikel. Silakan coba lagi.' };
		}
	}
};

