import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

/**
 * Comprehensive unit tests for slug.ts
 *
 * Test categories:
 * - Happy path: Normal title to slug conversion
 * - Edge cases: Unicode, emoji, extreme lengths, special whitespace
 * - Boundary conditions: Empty, single char, very long strings
 * - Failure resistance: Malformed inputs that should not crash
 */
describe('generateSlug', () => {
	// ============================================================
	// Happy Path Tests
	// ============================================================
	describe('Happy Path - Basic Transformations', () => {
		it('should convert title to lowercase', () => {
			expect(generateSlug('Hello World')).toBe('hello-world');
		});

		it('should replace spaces with hyphens', () => {
			expect(generateSlug('hello world test')).toBe('hello-world-test');
		});

		it('should remove special characters', () => {
			expect(generateSlug('Hello! World? #Test')).toBe('hello-world-test');
		});

		it('should handle Indonesian text', () => {
			expect(generateSlug('Berita Terkini Hari Ini')).toBe('berita-terkini-hari-ini');
		});

		it('should preserve numbers', () => {
			expect(generateSlug('Article 123 Test')).toBe('article-123-test');
		});

		it('should handle single word', () => {
			expect(generateSlug('Hello')).toBe('hello');
		});

		it('should handle numbers at start', () => {
			expect(generateSlug('123 News Article')).toBe('123-news-article');
		});

		it('should handle hyphens in input', () => {
			expect(generateSlug('well-known fact')).toBe('well-known-fact');
		});
	});

	// ============================================================
	// Edge Cases - Whitespace Handling
	// ============================================================
	describe('Edge Cases - Whitespace', () => {
		it('should handle multiple consecutive spaces', () => {
			expect(generateSlug('hello   world')).toBe('hello-world');
		});

		it('should trim leading and trailing whitespace', () => {
			expect(generateSlug('  hello world  ')).toBe('hello-world');
		});

		it('should handle only whitespace', () => {
			expect(generateSlug('   ')).toBe('');
		});

		it('should handle tab characters', () => {
			expect(generateSlug('hello\tworld')).toBe('hello-world');
		});

		it('should handle newline characters', () => {
			expect(generateSlug('hello\nworld')).toBe('hello-world');
		});

		it('should handle carriage return', () => {
			expect(generateSlug('hello\rworld')).toBe('hello-world');
		});

		it('should handle mixed whitespace types', () => {
			expect(generateSlug('hello \t\n\r world')).toBe('hello-world');
		});

		it('should handle non-breaking space (\\u00A0)', () => {
			// Non-breaking space should be treated as regular space
			expect(generateSlug('hello\u00A0world')).toBe('hello-world');
		});

		it('should handle zero-width space (\\u200B)', () => {
			// Zero-width space might be removed or treated as separator
			const result = generateSlug('hello\u200Bworld');
			// Implementation removes non-word chars, so expect removal
			expect(result).toBe('helloworld');
		});
	});

	// ============================================================
	// Edge Cases - Special Characters
	// ============================================================
	describe('Edge Cases - Special Characters', () => {
		it('should replace underscores with hyphens', () => {
			expect(generateSlug('hello_world_test')).toBe('hello-world-test');
		});

		it('should remove leading hyphens', () => {
			expect(generateSlug('---hello-world')).toBe('hello-world');
		});

		it('should remove trailing hyphens', () => {
			expect(generateSlug('hello-world---')).toBe('hello-world');
		});

		it('should handle mixed special characters and spaces', () => {
			expect(generateSlug('Hello!! -- World__Test')).toBe('hello-world-test');
		});

		it('should handle string with only special characters', () => {
			expect(generateSlug('!@#$%^&*()')).toBe('');
		});

		it('should handle ampersand', () => {
			expect(generateSlug('Tom & Jerry')).toBe('tom-jerry');
		});

		it('should handle plus sign', () => {
			expect(generateSlug('C++ Programming')).toBe('c-programming');
		});

		it('should handle at symbol', () => {
			expect(generateSlug('Contact @admin')).toBe('contact-admin');
		});

		it('should handle dollar sign', () => {
			expect(generateSlug('Price $100')).toBe('price-100');
		});

		it('should handle percent sign', () => {
			expect(generateSlug('50% Discount')).toBe('50-discount');
		});

		it('should handle parentheses', () => {
			expect(generateSlug('Hello (World)')).toBe('hello-world');
		});

		it('should handle brackets', () => {
			expect(generateSlug('Title [Updated]')).toBe('title-updated');
		});

		it('should handle curly braces', () => {
			expect(generateSlug('Code {example}')).toBe('code-example');
		});

		it('should handle quotes', () => {
			expect(generateSlug('Say "Hello"')).toBe('say-hello');
		});

		it('should handle apostrophe', () => {
			expect(generateSlug("It's working")).toBe('its-working');
		});

		it('should handle colon and semicolon', () => {
			expect(generateSlug('Title: Subtitle; More')).toBe('title-subtitle-more');
		});

		it('should handle forward slash', () => {
			expect(generateSlug('Category/Subcategory')).toBe('categorysubcategory');
		});

		it('should handle backslash', () => {
			expect(generateSlug('Path\\to\\file')).toBe('pathtofile');
		});

		it('should handle pipe character', () => {
			expect(generateSlug('Option A | Option B')).toBe('option-a-option-b');
		});
	});

	// ============================================================
	// Edge Cases - Unicode and International
	// ============================================================
	describe('Edge Cases - Unicode and International', () => {
		it('should handle accented Latin characters', () => {
			// Note: Current implementation removes non-ASCII, so accents are stripped
			const result = generateSlug('Café résumé naïve');
			// Depending on implementation, might be 'caf-rsum-nave' or 'cafe-resume-naive'
			expect(result).toMatch(/^[a-z0-9-]+$/);
		});

		it('should handle German umlauts', () => {
			const result = generateSlug('Über München');
			expect(result).toMatch(/^[a-z0-9-]+$/);
		});

		it('should handle Spanish characters', () => {
			const result = generateSlug('Español señor');
			expect(result).toMatch(/^[a-z0-9-]+$/);
		});

		it('should handle Chinese characters', () => {
			// Chinese chars are non-word in ASCII regex, likely removed
			const result = generateSlug('新闻标题');
			// May result in empty or partial
			expect(typeof result).toBe('string');
		});

		it('should handle Japanese characters', () => {
			const result = generateSlug('ニュース');
			expect(typeof result).toBe('string');
		});

		it('should handle Korean characters', () => {
			const result = generateSlug('뉴스 제목');
			expect(typeof result).toBe('string');
		});

		it('should handle Arabic characters', () => {
			const result = generateSlug('أخبار اليوم');
			expect(typeof result).toBe('string');
		});

		it('should handle Russian Cyrillic', () => {
			const result = generateSlug('Новости дня');
			expect(typeof result).toBe('string');
		});

		it('should handle Greek characters', () => {
			const result = generateSlug('Ελληνικά');
			expect(typeof result).toBe('string');
		});

		it('should handle Hebrew characters', () => {
			const result = generateSlug('חדשות היום');
			expect(typeof result).toBe('string');
		});

		it('should handle Thai characters', () => {
			const result = generateSlug('ข่าววันนี้');
			expect(typeof result).toBe('string');
		});

		it('should handle mixed ASCII and Unicode', () => {
			const result = generateSlug('News 新闻 Update');
			// Should at least preserve ASCII parts
			expect(result).toContain('news');
			expect(result).toContain('update');
		});
	});

	// ============================================================
	// Edge Cases - Emoji
	// ============================================================
	describe('Edge Cases - Emoji', () => {
		it('should handle single emoji', () => {
			const result = generateSlug('🎉');
			// Emoji should be removed
			expect(result).toBe('');
		});

		it('should handle emoji in text', () => {
			const result = generateSlug('Breaking News 🔥');
			expect(result).toBe('breaking-news');
		});

		it('should handle multiple emojis', () => {
			const result = generateSlug('🎉 Party 🎊 Time 🎈');
			expect(result).toBe('party-time');
		});

		it('should handle emoji at start', () => {
			const result = generateSlug('👋 Hello World');
			expect(result).toBe('hello-world');
		});

		it('should handle emoji at end', () => {
			const result = generateSlug('Hello World 👋');
			expect(result).toBe('hello-world');
		});

		it('should handle complex emoji (skin tones)', () => {
			const result = generateSlug('Hello 👋🏽 World');
			expect(result).toBe('hello-world');
		});

		it('should handle emoji sequences (flags)', () => {
			const result = generateSlug('Indonesia 🇮🇩 News');
			expect(result).toBe('indonesia-news');
		});

		it('should handle only emojis', () => {
			const result = generateSlug('🎉🎊🎈');
			expect(result).toBe('');
		});
	});

	// ============================================================
	// Boundary Conditions
	// ============================================================
	describe('Boundary Conditions', () => {
		it('should handle empty string', () => {
			expect(generateSlug('')).toBe('');
		});

		it('should handle single character - letter', () => {
			expect(generateSlug('A')).toBe('a');
		});

		it('should handle single character - number', () => {
			expect(generateSlug('5')).toBe('5');
		});

		it('should handle single character - special', () => {
			expect(generateSlug('!')).toBe('');
		});

		it('should handle single character - space', () => {
			expect(generateSlug(' ')).toBe('');
		});

		it('should handle two characters', () => {
			expect(generateSlug('AB')).toBe('ab');
		});

		it('should handle long string (1,000 characters)', () => {
			const longTitle = 'word '.repeat(200); // 1000 chars
			const result = generateSlug(longTitle);

			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toContain('  ');
			expect(result).toMatch(/^[a-z0-9-]+$/);
		});

		it('should handle very long string (10,000 characters)', () => {
			const veryLongTitle = 'test '.repeat(2000);
			const result = generateSlug(veryLongTitle);

			expect(result).toMatch(/^[a-z0-9-]+$/);
			// Should not have leading/trailing hyphens
			expect(result[0]).not.toBe('-');
			expect(result[result.length - 1]).not.toBe('-');
		});

		it('should handle extremely long string (100,000 characters)', () => {
			const extremelyLong = 'a'.repeat(100000);
			const result = generateSlug(extremelyLong);

			expect(result).toBe('a'.repeat(100000));
		});

		it('should handle string with only numbers', () => {
			expect(generateSlug('123456')).toBe('123456');
		});

		it('should handle string with only hyphens', () => {
			expect(generateSlug('---')).toBe('');
		});

		it('should handle string with only underscores', () => {
			expect(generateSlug('___')).toBe('');
		});
	});

	// ============================================================
	// HTML and Code Content
	// ============================================================
	describe('Edge Cases - HTML and Code', () => {
		it('should handle HTML tags', () => {
			expect(generateSlug('<h1>Title</h1>')).toBe('h1titleh1');
		});

		it('should handle HTML entities', () => {
			expect(generateSlug('Hello &amp; World')).toBe('hello-amp-world');
		});

		it('should handle script tags', () => {
			expect(generateSlug('<script>alert("xss")</script>')).toBe('scriptalertxssscript');
		});

		it('should handle CSS selectors', () => {
			expect(generateSlug('.class #id')).toBe('class-id');
		});

		it('should handle URL-like strings', () => {
			expect(generateSlug('https://example.com/path')).toBe('httpsexamplecompath');
		});

		it('should handle email-like strings', () => {
			expect(generateSlug('user@example.com')).toBe('userexamplecom');
		});

		it('should handle code snippets', () => {
			expect(generateSlug('function() { return true; }')).toBe('function-return-true');
		});
	});

	// ============================================================
	// Real-world Title Examples
	// ============================================================
	describe('Real-world Examples', () => {
		it('should handle news headline with date', () => {
			expect(generateSlug('Breaking News: January 15, 2024')).toBe('breaking-news-january-15-2024');
		});

		it('should handle title with abbreviations', () => {
			expect(generateSlug('NASA Announces New Mission to Mars')).toBe('nasa-announces-new-mission-to-mars');
		});

		it('should handle title with numbers and units', () => {
			expect(generateSlug('Temperature Reaches 40°C in Jakarta')).toBe('temperature-reaches-40c-in-jakarta');
		});

		it('should handle question titles', () => {
			expect(generateSlug('What Is the Future of AI?')).toBe('what-is-the-future-of-ai');
		});

		it('should handle title with quotes', () => {
			expect(generateSlug('President Says "We Will Prevail"')).toBe('president-says-we-will-prevail');
		});

		it('should handle Indonesian news title', () => {
			expect(generateSlug('Gempa Bumi 6.5 SR Guncang Sulawesi')).toBe('gempa-bumi-65-sr-guncang-sulawesi');
		});

		it('should handle sports score', () => {
			expect(generateSlug('Final Score: Indonesia 3-1 Malaysia')).toBe('final-score-indonesia-3-1-malaysia');
		});

		it('should handle currency in title', () => {
			expect(generateSlug('Rupiah Drops to Rp15,000/$')).toBe('rupiah-drops-to-rp15000');
		});

		it('should handle percentage in title', () => {
			expect(generateSlug('Economy Grows 5.2% in Q3')).toBe('economy-grows-52-in-q3');
		});

		it('should handle hashtags', () => {
			expect(generateSlug('Trending: #Indonesia #News')).toBe('trending-indonesia-news');
		});
	});

	// ============================================================
	// Idempotency and Consistency
	// ============================================================
	describe('Idempotency and Consistency', () => {
		it('should be idempotent - applying twice gives same result', () => {
			const original = 'Hello World! Test 123';
			const firstPass = generateSlug(original);
			const secondPass = generateSlug(firstPass);

			expect(secondPass).toBe(firstPass);
		});

		it('should produce consistent results for same input', () => {
			const input = 'Test Title Here';
			const results = Array.from({ length: 100 }, () => generateSlug(input));

			expect(new Set(results).size).toBe(1);
		});

		it('should produce URL-safe output', () => {
			const input = 'Complex Title With Special Chars!@#$%';
			const result = generateSlug(input);

			// Should be safe to use in URL without encoding
			expect(encodeURIComponent(result)).toBe(result);
		});

		it('should never produce double hyphens', () => {
			const inputs = [
				'Hello   World',
				'Test -- Title',
				'Many     Spaces',
				'Under___scores',
				'Mixed-_-Chars'
			];

			inputs.forEach((input) => {
				const result = generateSlug(input);
				expect(result).not.toContain('--');
			});
		});
	});
});
