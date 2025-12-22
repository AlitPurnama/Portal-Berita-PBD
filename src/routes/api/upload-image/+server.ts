import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadAndOptimizeImage, validateImageFile } from '$lib/server/image-utils';
import * as auth from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user) {
		throw error(401, 'Anda harus login untuk mengupload gambar');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('image') as File;

		if (!file) {
			throw error(400, 'File gambar tidak ditemukan');
		}

		// Validate file
		const validation = validateImageFile(file);
		if (!validation.valid) {
			throw error(400, validation.error || 'File tidak valid');
		}

		// Upload and optimize
		const result = await uploadAndOptimizeImage(file);

		return json({
			success: true,
			urls: result, // Use 'urls' for consistency
			images: result // Keep 'images' for backward compatibility
		});
	} catch (err: any) {
		console.error('Error uploading image:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, err.message || 'Gagal mengupload gambar');
	}
};

