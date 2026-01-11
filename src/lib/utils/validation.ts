/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
export const VALID_CATEGORIES = [
	'Olahraga',
	'Budaya',
	'Teknologi',
	'Kesehatan',
	'Bencana',
	'Lainnya'
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
	if (!email || email.trim() === '') {
		return { valid: false, error: 'Email wajib diisi' };
	}
	if (!EMAIL_REGEX.test(email)) {
		return { valid: false, error: 'Format email tidak valid' };
	}
	return { valid: true };
}

/**
 * Validate username format (3-20 chars, alphanumeric, underscore, dash)
 */
export function validateUsername(username: string): ValidationResult {
	if (!username || username.trim() === '') {
		return { valid: false, error: 'Username wajib diisi' };
	}
	if (!USERNAME_REGEX.test(username)) {
		return {
			valid: false,
			error: 'Username harus 3-20 karakter, hanya boleh huruf, angka, underscore (_), dan dash (-)'
		};
	}
	return { valid: true };
}

/**
 * Validate password (minimum 6 characters)
 */
export function validatePassword(password: string): ValidationResult {
	if (!password) {
		return { valid: false, error: 'Password wajib diisi' };
	}
	if (password.length < 6) {
		return { valid: false, error: 'Password harus minimal 6 karakter' };
	}
	return { valid: true };
}

/**
 * Validate article title (minimum 5 characters)
 */
export function validateArticleTitle(title: string): ValidationResult {
	if (!title || title.trim() === '') {
		return { valid: false, error: 'Judul wajib diisi' };
	}
	if (title.length < 5) {
		return { valid: false, error: 'Judul harus minimal 5 karakter' };
	}
	return { valid: true };
}

/**
 * Validate article content (minimum 50 characters)
 */
export function validateArticleContent(content: string): ValidationResult {
	if (!content || content.trim() === '') {
		return { valid: false, error: 'Konten wajib diisi' };
	}
	if (content.length < 50) {
		return { valid: false, error: 'Konten harus minimal 50 karakter' };
	}
	return { valid: true };
}

/**
 * Validate article category
 */
export function validateCategory(category: string): ValidationResult {
	if (!category || category.trim() === '') {
		return { valid: false, error: 'Kategori wajib diisi' };
	}
	if (!VALID_CATEGORIES.includes(category as ValidCategory)) {
		return { valid: false, error: 'Kategori tidak valid' };
	}
	return { valid: true };
}

/**
 * Validate that two passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
	if (password !== confirmPassword) {
		return { valid: false, error: 'Password tidak sama' };
	}
	return { valid: true };
}
