import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { encodeBase64url } from '@oslojs/encoding';
import { randomBytes } from 'node:crypto';

export const UPLOAD_DIR = 'static/uploads';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] as const;

export interface ImageUploadResult {
	original: string;
	thumbnail: string;
	medium: string;
	large: string;
}

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
	// In SvelteKit, static files are in project root
	const uploadPath = join(process.cwd(), UPLOAD_DIR);
	if (!existsSync(uploadPath)) {
		await mkdir(uploadPath, { recursive: true });
	}
	return uploadPath;
}

/**
 * Generate unique filename
 */
export function generateFilename(originalName: string): string {
	const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
	const randomId = encodeBase64url(randomBytes(12));
	const timestamp = Date.now();
	return `${timestamp}-${randomId}.${ext}`;
}

/**
 * Validate uploaded file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
	if (file.size > MAX_FILE_SIZE) {
		return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 5MB.' };
	}

	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' };
	}

	return { valid: true };
}

/**
 * Process and optimize image
 */
export async function processImage(
	file: File,
	options?: {
		quality?: number;
		format?: 'webp' | 'jpeg' | 'png';
	}
): Promise<Buffer> {
	const buffer = Buffer.from(await file.arrayBuffer());
	const { quality = 85, format = 'webp' } = options || {};

	let sharpInstance = sharp(buffer);

	// Auto-rotate based on EXIF
	sharpInstance = sharpInstance.rotate();

	// Convert to specified format
	if (format === 'webp') {
		sharpInstance = sharpInstance.webp({ quality });
	} else if (format === 'jpeg') {
		sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
	} else if (format === 'png') {
		sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
	}

	return await sharpInstance.toBuffer();
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
	buffer: Buffer,
	width: number,
	height?: number,
	options?: { quality?: number; format?: 'webp' | 'jpeg' | 'png' }
): Promise<Buffer> {
	const { quality = 85, format = 'webp' } = options || {};

	let sharpInstance = sharp(buffer)
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate();

	if (format === 'webp') {
		sharpInstance = sharpInstance.webp({ quality });
	} else if (format === 'jpeg') {
		sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
	} else if (format === 'png') {
		sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
	}

	return await sharpInstance.toBuffer();
}

/**
 * Upload and optimize image with multiple sizes
 */
export async function uploadAndOptimizeImage(file: File): Promise<ImageUploadResult> {
	// Validate file
	const validation = validateImageFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	// Ensure upload directory exists
	const uploadPath = await ensureUploadDir();

	// Generate unique filename
	const originalFilename = generateFilename(file.name);
	const baseName = originalFilename.replace(/\.[^/.]+$/, '');

	// Process original image
	const originalBuffer = await processImage(file, { quality: 90, format: 'webp' });
	const originalPath = join(uploadPath, `${baseName}-original.webp`);
	await writeFile(originalPath, originalBuffer);

	// Generate thumbnail (300x300)
	const thumbnailBuffer = await resizeImage(originalBuffer, 300, 300, {
		quality: 80,
		format: 'webp'
	});
	const thumbnailPath = join(uploadPath, `${baseName}-thumb.webp`);
	await writeFile(thumbnailPath, thumbnailBuffer);

	// Generate medium (800x800)
	const mediumBuffer = await resizeImage(originalBuffer, 800, 800, {
		quality: 85,
		format: 'webp'
	});
	const mediumPath = join(uploadPath, `${baseName}-medium.webp`);
	await writeFile(mediumPath, mediumBuffer);

	// Generate large (1200x1200)
	const largeBuffer = await resizeImage(originalBuffer, 1200, 1200, {
		quality: 90,
		format: 'webp'
	});
	const largePath = join(uploadPath, `${baseName}-large.webp`);
	await writeFile(largePath, largeBuffer);

	// Return relative paths (accessible via /uploads/...)
	return {
		original: `/uploads/${baseName}-original.webp`,
		thumbnail: `/uploads/${baseName}-thumb.webp`,
		medium: `/uploads/${baseName}-medium.webp`,
		large: `/uploads/${baseName}-large.webp`
	};
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
	const metadata = await sharp(buffer).metadata();
	return {
		width: metadata.width,
		height: metadata.height,
		format: metadata.format,
		size: buffer.length
	};
}

