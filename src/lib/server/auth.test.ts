import { describe, it, expect } from 'vitest';
import { generateSessionToken, hashPassword, verifyPassword } from './auth';

/**
 * Comprehensive unit tests for auth.ts pure functions
 *
 * Test categories:
 * - Happy path: Normal expected usage
 * - Edge cases: Boundary conditions, unusual but valid inputs
 * - Failure cases: Invalid inputs, malformed data
 * - Security: Password handling edge cases
 */
describe('auth - pure functions', () => {
	// ============================================================
	// generateSessionToken() Tests
	// ============================================================
	describe('generateSessionToken', () => {
		describe('Happy Path', () => {
			it('should generate a base64url encoded token', () => {
				const token = generateSessionToken();
				// Base64url alphabet: A-Z, a-z, 0-9, -, _
				// 18 bytes encoded as base64url = 24 characters
				expect(token).toMatch(/^[A-Za-z0-9_-]{24}$/);
			});

			it('should have correct length of 24 characters', () => {
				const token = generateSessionToken();
				expect(token.length).toBe(24);
			});

			it('should generate unique tokens on each call', () => {
				const tokens = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
				expect(tokens.size).toBe(100);
			});
		});

		describe('Edge Cases', () => {
			it('should generate tokens with consistent format across multiple calls', () => {
				// Verify 1000 tokens all match expected format
				for (let i = 0; i < 1000; i++) {
					const token = generateSessionToken();
					expect(token).toMatch(/^[A-Za-z0-9_-]{24}$/);
				}
			});

			it('should never generate tokens with invalid base64url characters', () => {
				// Characters that should NOT appear: +, /, =
				for (let i = 0; i < 100; i++) {
					const token = generateSessionToken();
					expect(token).not.toMatch(/[+/=]/);
				}
			});

			it('should generate cryptographically random tokens (statistical test)', () => {
				// Generate many tokens and check character distribution is roughly uniform
				const tokens = Array.from({ length: 1000 }, () => generateSessionToken());
				const allChars = tokens.join('');

				// Check that we have variety in characters (not all same char)
				const uniqueChars = new Set(allChars.split(''));
				// Base64url has 64 possible chars, we should see many of them
				expect(uniqueChars.size).toBeGreaterThan(40);
			});

			it('should be safe to use in URLs without encoding', () => {
				const token = generateSessionToken();
				// URL-safe means no characters that need encoding
				expect(encodeURIComponent(token)).toBe(token);
			});
		});

		describe('Uniqueness Guarantee', () => {
			it('should have astronomically low collision probability', () => {
				// 18 bytes = 144 bits of entropy
				// With 10,000 tokens, collision probability is negligible
				const tokens = new Set<string>();
				for (let i = 0; i < 10000; i++) {
					const token = generateSessionToken();
					expect(tokens.has(token)).toBe(false);
					tokens.add(token);
				}
			});
		});
	});

	// ============================================================
	// hashPassword() Tests
	// ============================================================
	describe('hashPassword', () => {
		describe('Happy Path', () => {
			it('should return a hash in format "salt:hash"', async () => {
				const hash = await hashPassword('testPassword123');
				// 32 hex chars (16 bytes salt) + colon + 64 hex chars (32 bytes sha256)
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should generate different hashes for the same password due to random salt', async () => {
				const hash1 = await hashPassword('samePassword');
				const hash2 = await hashPassword('samePassword');
				expect(hash1).not.toBe(hash2);
			});

			it('should generate consistent hash length regardless of password length', async () => {
				const shortHash = await hashPassword('a');
				const longHash = await hashPassword('a'.repeat(10000));

				// Both should have same format: 32 + 1 + 64 = 97 characters
				expect(shortHash.length).toBe(97);
				expect(longHash.length).toBe(97);
			});
		});

		describe('Edge Cases - Empty and Whitespace', () => {
			it('should handle empty password', async () => {
				const hash = await hashPassword('');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should handle password with only spaces', async () => {
				const hash = await hashPassword('     ');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should handle password with tabs and newlines', async () => {
				const hash = await hashPassword('\t\n\r');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should distinguish between different whitespace passwords', async () => {
				const hashSpaces = await hashPassword('   ');
				const hashTabs = await hashPassword('\t\t\t');

				// Extract hash parts (after salt) - they should differ
				const hash1 = hashSpaces.split(':')[1];
				const hash2 = hashTabs.split(':')[1];

				// Note: Due to different salts, we verify by checking verifyPassword
				expect(await verifyPassword('   ', hashSpaces)).toBe(true);
				expect(await verifyPassword('\t\t\t', hashSpaces)).toBe(false);
			});
		});

		describe('Edge Cases - Long Passwords', () => {
			it('should handle very long passwords (10,000 characters)', async () => {
				const longPassword = 'a'.repeat(10000);
				const hash = await hashPassword(longPassword);
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should handle extremely long passwords (100,000 characters)', async () => {
				const veryLongPassword = 'x'.repeat(100000);
				const hash = await hashPassword(veryLongPassword);
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should correctly verify very long passwords', async () => {
				const longPassword = 'securePassword!'.repeat(1000);
				const hash = await hashPassword(longPassword);
				expect(await verifyPassword(longPassword, hash)).toBe(true);
			});
		});

		describe('Edge Cases - Special Characters', () => {
			it('should handle ASCII special characters', async () => {
				const hash = await hashPassword('p@$$w0rd!#%^&*()');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should handle unicode characters', async () => {
				const hash = await hashPassword('密码🔐パスワード');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
			});

			it('should handle emoji passwords', async () => {
				const hash = await hashPassword('🔑🔐🛡️💪');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
				expect(await verifyPassword('🔑🔐🛡️💪', hash)).toBe(true);
			});

			it('should handle null bytes in password', async () => {
				const hash = await hashPassword('pass\x00word');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
				expect(await verifyPassword('pass\x00word', hash)).toBe(true);
				expect(await verifyPassword('password', hash)).toBe(false);
			});

			it('should handle combining unicode characters', async () => {
				// é can be represented as e + combining acute accent
				const composed = 'café';
				const decomposed = 'cafe\u0301';

				const hashComposed = await hashPassword(composed);
				const hashDecomposed = await hashPassword(decomposed);

				// These are different byte sequences, so should produce different verification
				expect(await verifyPassword(composed, hashComposed)).toBe(true);
				expect(await verifyPassword(decomposed, hashDecomposed)).toBe(true);
			});

			it('should handle RTL characters (Arabic/Hebrew)', async () => {
				const hash = await hashPassword('كلمة السر');
				expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
				expect(await verifyPassword('كلمة السر', hash)).toBe(true);
			});
		});

		describe('Hash Format Verification', () => {
			it('should always use lowercase hex characters', async () => {
				for (let i = 0; i < 50; i++) {
					const hash = await hashPassword(`test${i}`);
					expect(hash).not.toMatch(/[A-F]/); // No uppercase hex
				}
			});

			it('should have exactly one colon separator', async () => {
				const hash = await hashPassword('test');
				const colonCount = (hash.match(/:/g) || []).length;
				expect(colonCount).toBe(1);
			});

			it('should have salt of exactly 32 hex characters', async () => {
				const hash = await hashPassword('test');
				const salt = hash.split(':')[0];
				expect(salt.length).toBe(32);
			});

			it('should have hash of exactly 64 hex characters (SHA-256)', async () => {
				const hash = await hashPassword('test');
				const hashPart = hash.split(':')[1];
				expect(hashPart.length).toBe(64);
			});
		});

		describe('Security Properties', () => {
			it('should produce different salts for each hash', async () => {
				const salts = new Set<string>();
				for (let i = 0; i < 100; i++) {
					const hash = await hashPassword('samePassword');
					const salt = hash.split(':')[0];
					expect(salts.has(salt)).toBe(false);
					salts.add(salt);
				}
			});

			it('should not leak password in hash output', async () => {
				const password = 'mySecretPassword123';
				const hash = await hashPassword(password);

				// Hash should not contain the password in any form
				expect(hash.toLowerCase()).not.toContain(password.toLowerCase());
			});
		});
	});

	// ============================================================
	// verifyPassword() Tests
	// ============================================================
	describe('verifyPassword', () => {
		describe('Happy Path', () => {
			it('should return true for correct password', async () => {
				const password = 'correctPassword';
				const hash = await hashPassword(password);
				const result = await verifyPassword(password, hash);
				expect(result).toBe(true);
			});

			it('should return false for incorrect password', async () => {
				const hash = await hashPassword('correctPassword');
				const result = await verifyPassword('wrongPassword', hash);
				expect(result).toBe(false);
			});

			it('should work correctly multiple times with same hash', async () => {
				const password = 'testPassword';
				const hash = await hashPassword(password);

				// Verify multiple times
				expect(await verifyPassword(password, hash)).toBe(true);
				expect(await verifyPassword(password, hash)).toBe(true);
				expect(await verifyPassword(password, hash)).toBe(true);
			});
		});

		describe('Malformed Hash Handling', () => {
			it('should return false for hash without colon', async () => {
				const result = await verifyPassword('password', 'invalidhashwithoutcolon');
				expect(result).toBe(false);
			});

			it('should return false for empty hash', async () => {
				const result = await verifyPassword('password', '');
				expect(result).toBe(false);
			});

			it('should return false for hash with empty salt', async () => {
				const result = await verifyPassword('password', ':somehash');
				expect(result).toBe(false);
			});

			it('should return false for hash with empty hash part', async () => {
				const result = await verifyPassword('password', 'somesalt:');
				expect(result).toBe(false);
			});

			it('should return false for hash with multiple colons', async () => {
				const result = await verifyPassword('password', 'salt:hash:extra');
				expect(result).toBe(false);
			});

			it('should return false for hash with non-hex salt', async () => {
				const result = await verifyPassword('password', 'notahexstring!@#$%^&*:' + 'a'.repeat(64));
				expect(result).toBe(false);
			});

			it('should return false for hash with wrong salt length', async () => {
				// Salt should be 32 chars, using 16
				const result = await verifyPassword('password', 'a'.repeat(16) + ':' + 'b'.repeat(64));
				expect(result).toBe(false);
			});

			it('should return false for hash with wrong hash length', async () => {
				// Hash should be 64 chars, using 32
				const result = await verifyPassword('password', 'a'.repeat(32) + ':' + 'b'.repeat(32));
				expect(result).toBe(false);
			});

			it('should handle only colon as hash', async () => {
				const result = await verifyPassword('password', ':');
				expect(result).toBe(false);
			});

			it('should handle whitespace-only hash', async () => {
				const result = await verifyPassword('password', '   ');
				expect(result).toBe(false);
			});
		});

		describe('Edge Cases - Empty and Whitespace Passwords', () => {
			it('should handle empty password correctly', async () => {
				const hash = await hashPassword('');
				expect(await verifyPassword('', hash)).toBe(true);
				expect(await verifyPassword('notEmpty', hash)).toBe(false);
			});

			it('should distinguish empty from whitespace password', async () => {
				const emptyHash = await hashPassword('');
				const spaceHash = await hashPassword(' ');

				expect(await verifyPassword('', emptyHash)).toBe(true);
				expect(await verifyPassword(' ', emptyHash)).toBe(false);
				expect(await verifyPassword(' ', spaceHash)).toBe(true);
				expect(await verifyPassword('', spaceHash)).toBe(false);
			});

			it('should be sensitive to trailing/leading whitespace', async () => {
				const hash = await hashPassword('password');

				expect(await verifyPassword('password', hash)).toBe(true);
				expect(await verifyPassword(' password', hash)).toBe(false);
				expect(await verifyPassword('password ', hash)).toBe(false);
				expect(await verifyPassword(' password ', hash)).toBe(false);
			});
		});

		describe('Case Sensitivity', () => {
			it('should be case-sensitive for passwords', async () => {
				const hash = await hashPassword('Password');

				expect(await verifyPassword('Password', hash)).toBe(true);
				expect(await verifyPassword('password', hash)).toBe(false);
				expect(await verifyPassword('PASSWORD', hash)).toBe(false);
				expect(await verifyPassword('pASSWORD', hash)).toBe(false);
			});

			it('should distinguish similar looking characters', async () => {
				// O (letter) vs 0 (number), l (lowercase L) vs 1 (one) vs I (uppercase i)
				const hashO = await hashPassword('O');
				const hash0 = await hashPassword('0');

				expect(await verifyPassword('O', hashO)).toBe(true);
				expect(await verifyPassword('0', hashO)).toBe(false);
				expect(await verifyPassword('O', hash0)).toBe(false);
				expect(await verifyPassword('0', hash0)).toBe(true);
			});
		});

		describe('Special Characters Handling', () => {
			it('should handle ASCII special characters', async () => {
				const password = 'p@$$w0rd!#%^&*()';
				const hash = await hashPassword(password);

				expect(await verifyPassword(password, hash)).toBe(true);
				expect(await verifyPassword('p@$$w0rd', hash)).toBe(false);
			});

			it('should handle unicode passwords', async () => {
				const password = '密码🔐パスワード';
				const hash = await hashPassword(password);

				expect(await verifyPassword(password, hash)).toBe(true);
				expect(await verifyPassword('密码', hash)).toBe(false);
			});

			it('should handle null bytes correctly', async () => {
				const password = 'before\x00after';
				const hash = await hashPassword(password);

				expect(await verifyPassword('before\x00after', hash)).toBe(true);
				expect(await verifyPassword('before', hash)).toBe(false);
				expect(await verifyPassword('beforeafter', hash)).toBe(false);
			});

			it('should handle backslash characters', async () => {
				const password = 'path\\to\\secret';
				const hash = await hashPassword(password);

				expect(await verifyPassword('path\\to\\secret', hash)).toBe(true);
				expect(await verifyPassword('path/to/secret', hash)).toBe(false);
			});

			it('should handle quote characters', async () => {
				const password = `password'with"quotes\`backtick`;
				const hash = await hashPassword(password);

				expect(await verifyPassword(password, hash)).toBe(true);
			});
		});

		describe('Boundary Conditions', () => {
			it('should verify single character password', async () => {
				const hash = await hashPassword('a');
				expect(await verifyPassword('a', hash)).toBe(true);
				expect(await verifyPassword('b', hash)).toBe(false);
			});

			it('should verify very long password (10,000 chars)', async () => {
				const password = 'x'.repeat(10000);
				const hash = await hashPassword(password);

				expect(await verifyPassword(password, hash)).toBe(true);
				expect(await verifyPassword(password + 'y', hash)).toBe(false);
				expect(await verifyPassword(password.slice(0, -1), hash)).toBe(false);
			});

			it('should correctly reject password that differs by one character', async () => {
				const password = 'testPassword123';
				const hash = await hashPassword(password);

				// Change first char
				expect(await verifyPassword('TestPassword123', hash)).toBe(false);
				// Change last char
				expect(await verifyPassword('testPassword124', hash)).toBe(false);
				// Change middle char
				expect(await verifyPassword('testPasswOrd123', hash)).toBe(false);
			});
		});

		describe('Robustness Tests', () => {
			it('should handle rapid sequential verifications', async () => {
				const password = 'rapidTest';
				const hash = await hashPassword(password);

				const results = await Promise.all(
					Array.from({ length: 100 }, () => verifyPassword(password, hash))
				);

				expect(results.every(r => r === true)).toBe(true);
			});

			it('should handle concurrent verifications with different passwords', async () => {
				const passwords = ['pass1', 'pass2', 'pass3', 'pass4', 'pass5'];
				const hashes = await Promise.all(passwords.map(p => hashPassword(p)));

				// Verify each password against all hashes concurrently
				const results = await Promise.all(
					passwords.flatMap((password, i) =>
						hashes.map((hash, j) =>
							verifyPassword(password, hash).then(result => ({
								password,
								hashIndex: j,
								result,
								expected: i === j
							}))
						)
					)
				);

				results.forEach(({ result, expected }) => {
					expect(result).toBe(expected);
				});
			});
		});
	});
});
