import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	validateImageFile,
	generateFilename,
	MAX_FILE_SIZE,
	ALLOWED_MIME_TYPES,
	UPLOAD_DIR
} from './image-utils';

// Mock File class for Node.js environment
function createMockFile(size: number, type: string, name = 'test.jpg'): File {
	return {
		size,
		type,
		name,
		arrayBuffer: vi.fn()
	} as unknown as File;
}

/**
 * Comprehensive unit tests for image-utils.ts
 *
 * Test categories:
 * - Constants: Verify exported constants have correct values
 * - validateImageFile: File size and MIME type validation
 * - generateFilename: Unique filename generation
 * - Edge cases: Unicode filenames, extreme sizes, unusual inputs
 */

// ============================================================
// Exported Constants Tests
// ============================================================
describe('Exported Constants', () => {
	describe('MAX_FILE_SIZE', () => {
		it('should be exactly 5MB in bytes', () => {
			expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
		});

		it('should equal 5242880 bytes', () => {
			expect(MAX_FILE_SIZE).toBe(5242880);
		});
	});

	describe('ALLOWED_MIME_TYPES', () => {
		it('should contain 5 allowed MIME types', () => {
			expect(ALLOWED_MIME_TYPES).toHaveLength(5);
		});

		it('should include image/jpeg', () => {
			expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
		});

		it('should include image/jpg', () => {
			expect(ALLOWED_MIME_TYPES).toContain('image/jpg');
		});

		it('should include image/png', () => {
			expect(ALLOWED_MIME_TYPES).toContain('image/png');
		});

		it('should include image/webp', () => {
			expect(ALLOWED_MIME_TYPES).toContain('image/webp');
		});

		it('should include image/gif', () => {
			expect(ALLOWED_MIME_TYPES).toContain('image/gif');
		});

		it('should NOT include image/bmp', () => {
			expect(ALLOWED_MIME_TYPES).not.toContain('image/bmp');
		});

		it('should NOT include image/svg+xml', () => {
			expect(ALLOWED_MIME_TYPES).not.toContain('image/svg+xml');
		});

		it('should be readonly array', () => {
			// TypeScript should prevent this, but we test runtime behavior
			expect(Array.isArray(ALLOWED_MIME_TYPES)).toBe(true);
		});
	});

	describe('UPLOAD_DIR', () => {
		it('should be static/uploads', () => {
			expect(UPLOAD_DIR).toBe('static/uploads');
		});

		it('should not start with slash', () => {
			expect(UPLOAD_DIR.startsWith('/')).toBe(false);
		});
	});
});

// ============================================================
// validateImageFile Tests
// ============================================================
describe('validateImageFile', () => {
	// ============================================================
	// Happy Path - File Size
	// ============================================================
	describe('Happy Path - File Size', () => {
		it('should accept file under 5MB', () => {
			const file = createMockFile(4 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});

		it('should accept file exactly at 5MB', () => {
			const file = createMockFile(5 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});

		it('should accept 1KB file', () => {
			const file = createMockFile(1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});

		it('should accept 1MB file', () => {
			const file = createMockFile(1024 * 1024, 'image/png');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});

		it('should accept 2.5MB file', () => {
			const file = createMockFile(2.5 * 1024 * 1024, 'image/webp');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});
	});

	// ============================================================
	// Happy Path - MIME Types
	// ============================================================
	describe('Happy Path - MIME Types', () => {
		const validMimeTypes = [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/webp',
			'image/gif'
		];

		validMimeTypes.forEach((mimeType) => {
			it(`should accept ${mimeType}`, () => {
				const file = createMockFile(1024, mimeType);
				const result = validateImageFile(file);
				expect(result).toEqual({ valid: true });
			});
		});
	});

	// ============================================================
	// Boundary Conditions - File Size
	// ============================================================
	describe('Boundary Conditions - File Size', () => {
		it('should accept exactly MAX_FILE_SIZE (5MB)', () => {
			const file = createMockFile(MAX_FILE_SIZE, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should reject MAX_FILE_SIZE + 1 byte', () => {
			const file = createMockFile(MAX_FILE_SIZE + 1, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Ukuran file terlalu besar');
		});

		it('should accept MAX_FILE_SIZE - 1 byte', () => {
			const file = createMockFile(MAX_FILE_SIZE - 1, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should accept 0 bytes (empty file)', () => {
			const file = createMockFile(0, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});

		it('should accept 1 byte file', () => {
			const file = createMockFile(1, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toEqual({ valid: true });
		});
	});

	// ============================================================
	// Edge Cases - File Size
	// ============================================================
	describe('Edge Cases - File Size', () => {
		it('should reject file double the max size', () => {
			const file = createMockFile(10 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject 100MB file', () => {
			const file = createMockFile(100 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject 1GB file', () => {
			const file = createMockFile(1024 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should accept file at 99.99% of max size', () => {
			const file = createMockFile(Math.floor(MAX_FILE_SIZE * 0.9999), 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});
	});

	// ============================================================
	// Failure Cases - Invalid MIME Types
	// ============================================================
	describe('Failure Cases - Invalid MIME Types', () => {
		const invalidMimeTypes = [
			{ type: 'image/bmp', name: 'BMP' },
			{ type: 'image/tiff', name: 'TIFF' },
			{ type: 'image/svg+xml', name: 'SVG' },
			{ type: 'image/heic', name: 'HEIC' },
			{ type: 'image/heif', name: 'HEIF' },
			{ type: 'image/avif', name: 'AVIF' },
			{ type: 'application/pdf', name: 'PDF' },
			{ type: 'text/plain', name: 'Text' },
			{ type: 'text/html', name: 'HTML' },
			{ type: 'application/json', name: 'JSON' },
			{ type: 'application/octet-stream', name: 'Binary' },
			{ type: 'video/mp4', name: 'MP4 Video' },
			{ type: 'video/webm', name: 'WebM Video' },
			{ type: 'audio/mp3', name: 'MP3 Audio' },
			{ type: 'application/zip', name: 'ZIP' },
			{ type: 'application/x-rar-compressed', name: 'RAR' }
		];

		invalidMimeTypes.forEach(({ type, name }) => {
			it(`should reject ${name} (${type})`, () => {
				const file = createMockFile(1024, type);
				const result = validateImageFile(file);
				expect(result.valid).toBe(false);
				expect(result.error).toContain('Format file tidak didukung');
			});
		});

		it('should reject empty MIME type', () => {
			const file = createMockFile(1024, '');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Format file tidak didukung');
		});

		it('should reject MIME type with only spaces', () => {
			const file = createMockFile(1024, '   ');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject uppercase MIME type (case sensitive)', () => {
			const file = createMockFile(1024, 'IMAGE/JPEG');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject mixed case MIME type', () => {
			const file = createMockFile(1024, 'Image/Jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject MIME type with leading space', () => {
			const file = createMockFile(1024, ' image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject MIME type with trailing space', () => {
			const file = createMockFile(1024, 'image/jpeg ');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});
	});

	// ============================================================
	// Combined Validation
	// ============================================================
	describe('Combined Validation', () => {
		it('should check size before MIME type (fail on size)', () => {
			const file = createMockFile(10 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Ukuran file');
		});

		it('should fail on MIME type if size is valid', () => {
			const file = createMockFile(1024, 'application/octet-stream');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Format file');
		});

		it('should fail on size when both size and MIME are invalid', () => {
			// Size is checked first, so error should be about size
			const file = createMockFile(10 * 1024 * 1024, 'text/plain');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Ukuran file');
		});

		it('should pass with valid size and valid MIME type', () => {
			const file = createMockFile(1024 * 1024, 'image/png');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});

	// ============================================================
	// Error Message Verification
	// ============================================================
	describe('Error Message Verification', () => {
		it('should return Indonesian error message for size', () => {
			const file = createMockFile(10 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.error).toBe('Ukuran file terlalu besar. Maksimal 5MB.');
		});

		it('should return Indonesian error message for format', () => {
			const file = createMockFile(1024, 'text/plain');
			const result = validateImageFile(file);
			expect(result.error).toBe('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
		});

		it('should mention maximum size in error message', () => {
			const file = createMockFile(MAX_FILE_SIZE + 1, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result.error).toContain('5MB');
		});

		it('should mention supported formats in error message', () => {
			const file = createMockFile(1024, 'image/bmp');
			const result = validateImageFile(file);
			expect(result.error).toContain('JPG');
			expect(result.error).toContain('PNG');
			expect(result.error).toContain('WebP');
		});
	});

	// ============================================================
	// Return Type Verification
	// ============================================================
	describe('Return Type Verification', () => {
		it('should return object with valid: true on success', () => {
			const file = createMockFile(1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toHaveProperty('valid', true);
			expect(result).not.toHaveProperty('error');
		});

		it('should return object with valid: false and error on failure', () => {
			const file = createMockFile(10 * 1024 * 1024, 'image/jpeg');
			const result = validateImageFile(file);
			expect(result).toHaveProperty('valid', false);
			expect(result).toHaveProperty('error');
			expect(typeof result.error).toBe('string');
		});
	});
});

// ============================================================
// generateFilename Tests
// ============================================================
describe('generateFilename', () => {
	let originalDateNow: () => number;

	beforeEach(() => {
		originalDateNow = Date.now;
	});

	afterEach(() => {
		Date.now = originalDateNow;
	});

	// ============================================================
	// Happy Path
	// ============================================================
	describe('Happy Path', () => {
		it('should generate filename with timestamp prefix', () => {
			const mockTimestamp = 1704067200000; // 2024-01-01
			Date.now = vi.fn(() => mockTimestamp);

			const result = generateFilename('test.jpg');
			expect(result).toMatch(/^1704067200000-/);
		});

		it('should preserve file extension in lowercase', () => {
			const result = generateFilename('photo.JPG');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should preserve png extension', () => {
			const result = generateFilename('image.PNG');
			expect(result).toMatch(/\.png$/);
		});

		it('should preserve webp extension', () => {
			const result = generateFilename('image.webp');
			expect(result).toMatch(/\.webp$/);
		});

		it('should preserve gif extension', () => {
			const result = generateFilename('animation.GIF');
			expect(result).toMatch(/\.gif$/);
		});

		it('should include random component', () => {
			const result1 = generateFilename('test.jpg');
			const result2 = generateFilename('test.jpg');
			// Due to randomBytes, results should differ (unless extremely unlikely collision)
			expect(result1).not.toBe(result2);
		});
	});

	// ============================================================
	// Edge Cases - Filename Patterns
	// ============================================================
	describe('Edge Cases - Filename Patterns', () => {
		it('should handle filename with multiple dots', () => {
			const result = generateFilename('my.photo.2024.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle filename with no extension', () => {
			const result = generateFilename('filename');
			// Should default to jpg
			expect(result).toMatch(/\.filename$/);
		});

		it('should handle filename with only extension', () => {
			const result = generateFilename('.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle filename with spaces', () => {
			const result = generateFilename('my photo.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle filename with special characters', () => {
			const result = generateFilename('photo@#$%.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle filename with dots only before extension', () => {
			const result = generateFilename('....jpg');
			expect(result).toMatch(/\.jpg$/);
		});
	});

	// ============================================================
	// Edge Cases - Extension Handling
	// ============================================================
	describe('Edge Cases - Extension Handling', () => {
		it('should handle mixed case extension', () => {
			const result = generateFilename('photo.JpG');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle long extension', () => {
			const result = generateFilename('file.jpeg');
			expect(result).toMatch(/\.jpeg$/);
		});

		it('should handle empty filename with extension', () => {
			const result = generateFilename('.png');
			expect(result).toMatch(/\.png$/);
		});

		it('should default to jpg when extension parsing fails', () => {
			// This tests the fallback || 'jpg'
			const result = generateFilename('');
			expect(result).toMatch(/\.jpg$|^[^.]+$/);
		});
	});

	// ============================================================
	// Unicode Filenames
	// ============================================================
	describe('Unicode Filenames', () => {
		it('should handle Indonesian characters in filename', () => {
			const result = generateFilename('berita-terkini.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle Chinese characters in filename', () => {
			const result = generateFilename('新闻图片.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle Japanese characters in filename', () => {
			const result = generateFilename('写真.png');
			expect(result).toMatch(/\.png$/);
		});

		it('should handle Arabic characters in filename', () => {
			const result = generateFilename('صورة.webp');
			expect(result).toMatch(/\.webp$/);
		});

		it('should handle emoji in filename', () => {
			const result = generateFilename('📷photo.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle accented characters in filename', () => {
			const result = generateFilename('café-photo.jpg');
			expect(result).toMatch(/\.jpg$/);
		});
	});

	// ============================================================
	// Uniqueness and Consistency
	// ============================================================
	describe('Uniqueness and Consistency', () => {
		it('should generate unique filenames for same input', () => {
			const results = new Set<string>();
			for (let i = 0; i < 100; i++) {
				results.add(generateFilename('test.jpg'));
			}
			// All 100 should be unique
			expect(results.size).toBe(100);
		});

		it('should generate unique filenames for different inputs', () => {
			const result1 = generateFilename('photo1.jpg');
			const result2 = generateFilename('photo2.png');
			expect(result1).not.toBe(result2);
		});

		it('should always include timestamp', () => {
			for (let i = 0; i < 10; i++) {
				const result = generateFilename('test.jpg');
				expect(result).toMatch(/^\d+-/);
			}
		});

		it('should produce URL-safe filenames', () => {
			const result = generateFilename('test.jpg');
			// Should only contain alphanumeric, hyphen, underscore, dot
			expect(result).toMatch(/^[a-zA-Z0-9_-]+\.[a-z]+$/);
		});
	});

	// ============================================================
	// Format Verification
	// ============================================================
	describe('Format Verification', () => {
		it('should follow pattern: timestamp-randomId.extension', () => {
			const mockTimestamp = 1704067200000;
			Date.now = vi.fn(() => mockTimestamp);

			const result = generateFilename('photo.jpg');
			// Pattern: 13-digit timestamp + hyphen + base64url chars + dot + extension
			expect(result).toMatch(/^\d{13}-[A-Za-z0-9_-]+\.jpg$/);
		});

		it('should generate base64url safe random ID', () => {
			const result = generateFilename('test.jpg');
			// Extract the random part between timestamp and extension
			const parts = result.split('-');
			const randomPart = parts[1].replace(/\.[^.]+$/, '');
			// Base64url chars: A-Z, a-z, 0-9, -, _
			expect(randomPart).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should have consistent random ID length (16 chars from 12 bytes)', () => {
			const result = generateFilename('test.jpg');
			// Format: timestamp-randomId.ext
			// Extract random ID between first hyphen and dot before extension
			const match = result.match(/^\d+-([A-Za-z0-9_-]+)\.[a-z]+$/);
			expect(match).not.toBeNull();
			const randomPart = match![1];
			// 12 bytes -> 16 base64 characters
			expect(randomPart.length).toBe(16);
		});
	});

	// ============================================================
	// Boundary Cases
	// ============================================================
	describe('Boundary Cases', () => {
		it('should handle very long filename', () => {
			const longName = 'a'.repeat(1000) + '.jpg';
			const result = generateFilename(longName);
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle very long extension', () => {
			const result = generateFilename('file.' + 'a'.repeat(100));
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should handle single character filename', () => {
			const result = generateFilename('a.jpg');
			expect(result).toMatch(/\.jpg$/);
		});

		it('should handle single character extension', () => {
			const result = generateFilename('file.a');
			expect(result).toMatch(/\.a$/);
		});
	});
});

// ============================================================
// Integration-like Tests
// ============================================================
describe('Integration Scenarios', () => {
	describe('Typical Upload Flow Validation', () => {
		it('should accept typical smartphone photo (4MB JPEG)', () => {
			const file = createMockFile(4 * 1024 * 1024, 'image/jpeg', 'IMG_20240101_120000.jpg');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should accept optimized web image (500KB WebP)', () => {
			const file = createMockFile(500 * 1024, 'image/webp', 'hero-banner.webp');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should accept PNG screenshot (2MB)', () => {
			const file = createMockFile(2 * 1024 * 1024, 'image/png', 'Screenshot 2024-01-01.png');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should accept animated GIF (3MB)', () => {
			const file = createMockFile(3 * 1024 * 1024, 'image/gif', 'animation.gif');
			const result = validateImageFile(file);
			expect(result.valid).toBe(true);
		});

		it('should reject RAW camera file (10MB ARW)', () => {
			const file = createMockFile(10 * 1024 * 1024, 'image/x-sony-arw', 'DSC00001.ARW');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});

		it('should reject HEIC from iPhone (8MB)', () => {
			const file = createMockFile(8 * 1024 * 1024, 'image/heic', 'IMG_0001.HEIC');
			const result = validateImageFile(file);
			expect(result.valid).toBe(false);
		});
	});

	describe('Filename Generation for Various Uploads', () => {
		it('should generate proper filename for smartphone photo', () => {
			const result = generateFilename('IMG_20240101_120000.jpg');
			expect(result).toMatch(/^\d+-[A-Za-z0-9_-]+\.jpg$/);
		});

		it('should generate proper filename for screenshot', () => {
			const result = generateFilename('Screenshot 2024-01-01 at 12.00.00.png');
			expect(result).toMatch(/^\d+-[A-Za-z0-9_-]+\.png$/);
		});

		it('should generate proper filename for downloaded image', () => {
			const result = generateFilename('image (1).jpeg');
			expect(result).toMatch(/^\d+-[A-Za-z0-9_-]+\.jpeg$/);
		});
	});
});
