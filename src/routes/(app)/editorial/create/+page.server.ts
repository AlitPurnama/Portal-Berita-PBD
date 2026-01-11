import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { encodeBase64url } from '@oslojs/encoding';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { generateSlug } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		const returnUrl = url.pathname + url.search;
		throw redirect(302, `/login?redirect=${encodeURIComponent(returnUrl)}`);
	}

	// Check if there's a draftId in URL params
	const draftId = url.searchParams.get('draftId');
	
	if (draftId) {
		const [draft] = await db
			.select()
			.from(table.article)
			.where(eq(table.article.id, draftId))
			.limit(1);

		if (draft && draft.authorId === locals.user.id && !draft.publishedAt) {
			return {
				article: draft,
				draftId: draft.id
			};
		}
	}

	return {
		article: null,
		draftId: null
	};
};

export const actions: Actions = {
	saveDraft: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Anda harus login untuk menyimpan draft' });
		}

		const formData = await request.formData();
		const draftId = formData.get('draftId')?.toString();
		const judul = formData.get('judul')?.toString() || '';
		const kategori = formData.get('kategori')?.toString() || '';
		const tanggal = formData.get('tanggal')?.toString();
		const gambar = formData.get('gambar')?.toString();
		const excerpt = formData.get('excerpt')?.toString();
		const konten = formData.get('konten')?.toString() || '';

		// Minimal validation untuk draft
		if (!judul && !konten) {
			return fail(400, { error: 'Judul atau konten harus diisi' });
		}

		try {
			const now = new Date();
			let articleId: string;
			let slug: string;

			if (draftId) {
				// Update existing draft
				const [existing] = await db
					.select()
					.from(table.article)
					.where(eq(table.article.id, draftId))
					.limit(1);

				if (!existing || existing.authorId !== locals.user.id) {
					return fail(404, { error: 'Draft tidak ditemukan' });
				}

				// Generate slug if title changed
				if (judul && judul !== existing.title) {
					slug = generateSlug(judul);
					let baseSlug = slug;
					let counter = 1;

					while (true) {
						const [existingSlug] = await db
							.select()
							.from(table.article)
							.where(eq(table.article.slug, slug))
							.limit(1);

						if (!existingSlug || existingSlug.id === draftId) break;
						slug = `${baseSlug}-${counter}`;
						counter++;
					}
				} else {
					slug = existing.slug;
				}

				await db
					.update(table.article)
					.set({
						title: judul || existing.title,
						category: kategori || existing.category,
						slug: slug,
						featuredImage: gambar || existing.featuredImage,
						excerpt: excerpt || existing.excerpt,
						content: konten || existing.content,
						updatedAt: now
					})
					.where(eq(table.article.id, draftId));

				return { success: true, draftId, slug };
			} else {
				// Create new draft
				articleId = encodeBase64url(randomBytes(18));
				slug = judul ? generateSlug(judul) : `draft-${articleId.slice(0, 8)}`;
				let baseSlug = slug;
				let counter = 1;

				while (true) {
					const [existing] = await db
						.select()
						.from(table.article)
						.where(eq(table.article.slug, slug))
						.limit(1);

					if (!existing) break;
					slug = `${baseSlug}-${counter}`;
					counter++;
				}

				const newDraft = {
					id: articleId,
					title: judul || 'Draft Tanpa Judul',
					category: kategori || 'Lainnya',
					slug: slug,
					featuredImage: gambar || null,
					excerpt: excerpt || null,
					content: konten || '',
					authorId: locals.user.id,
					publishedAt: null, // Draft tidak memiliki publishedAt
					views: 0,
					createdAt: now,
					updatedAt: now
				};

				await db.insert(table.article).values(newDraft);

				return { success: true, draftId: articleId, slug };
			}
		} catch (error: any) {
			console.error('Error saving draft:', error);
			return fail(500, { error: 'Gagal menyimpan draft. Silakan coba lagi.' });
		}
	},

	publish: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Anda harus login untuk mempublish artikel' });
		}

		const formData = await request.formData();
		const draftId = formData.get('draftId')?.toString();
		const judul = formData.get('judul')?.toString();
		const kategori = formData.get('kategori')?.toString();
		const tanggal = formData.get('tanggal')?.toString();
		const gambar = formData.get('gambar')?.toString();
		const excerpt = formData.get('excerpt')?.toString();
		const konten = formData.get('konten')?.toString();

		// Validasi
		const validCategories = ['Olahraga', 'Budaya', 'Teknologi', 'Kesehatan', 'Bencana', 'Lainnya'];
		
		if (!judul || !kategori || !konten) {
			return fail(400, { error: 'Judul, kategori, dan konten wajib diisi' });
		}

		if (judul.length < 5) {
			return fail(400, { error: 'Judul harus minimal 5 karakter' });
		}

		if (!validCategories.includes(kategori)) {
			return fail(400, { error: 'Kategori tidak valid' });
		}

		if (konten.length < 50) {
			return fail(400, { error: 'Konten harus minimal 50 karakter' });
		}

		try {
			// Generate slug dari judul
			let slug = generateSlug(judul);
			let baseSlug = slug;
			let counter = 1;

			// Check if slug already exists
			while (true) {
				const [existing] = await db
					.select()
					.from(table.article)
					.where(eq(table.article.slug, slug))
					.limit(1);

				if (!existing || (draftId && existing.id === draftId)) break;
				slug = `${baseSlug}-${counter}`;
				counter++;
			}

			// Parse tanggal
			let publishedAt: Date | null = null;
			if (tanggal) {
				publishedAt = new Date(tanggal);
			}

			const now = new Date();

			if (draftId) {
				// Update existing draft to published
				const [existing] = await db
					.select()
					.from(table.article)
					.where(eq(table.article.id, draftId))
					.limit(1);

				if (!existing || existing.authorId !== locals.user.id) {
					return fail(404, { error: 'Draft tidak ditemukan' });
				}

				await db
					.update(table.article)
					.set({
						title: judul,
						category: kategori,
						slug: slug,
						featuredImage: gambar || null,
						excerpt: excerpt || null,
						content: konten,
						publishedAt: publishedAt,
						updatedAt: now
					})
					.where(eq(table.article.id, draftId));

				throw redirect(302, `/details/${slug}`);
			} else {
				// Create new article
				const articleId = encodeBase64url(randomBytes(18));
				const newArticle = {
					id: articleId,
					title: judul,
					category: kategori,
					slug: slug,
					featuredImage: gambar || null,
					excerpt: excerpt || null,
					content: konten,
					authorId: locals.user.id,
					publishedAt: publishedAt,
					views: 0,
					createdAt: now,
					updatedAt: now
				};

				await db.insert(table.article).values(newArticle);

				throw redirect(302, `/details/${slug}`);
			}
		} catch (error: any) {
			if (error.status === 302) {
				throw error; // Re-throw redirect
			}
			console.error('Error publishing article:', error);
			return fail(500, { error: 'Gagal mempublish artikel. Silakan coba lagi.' });
		}
	}
};
