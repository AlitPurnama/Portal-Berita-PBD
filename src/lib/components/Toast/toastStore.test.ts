import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	toastStore,
	showSuccess,
	showError,
	showWarning,
	showInfo,
	showNotification
} from './toastStore';
import type { ToastType, ToastMessage } from './toastStore';

/**
 * Comprehensive unit tests for toastStore.ts
 *
 * Test categories:
 * - Store operations: add, remove, subscribe
 * - Convenience functions: showSuccess, showError, showWarning, showInfo, showNotification
 * - Edge cases: empty messages, long messages, special characters
 * - Boundary conditions: duration values, ID handling
 * - Stress tests: rapid operations, many toasts
 */

// Helper to clear all toasts between tests
function clearAllToasts() {
	const toasts = get(toastStore);
	toasts.forEach((t) => toastStore.remove(t.id));
}

describe('toastStore', () => {
	beforeEach(() => {
		clearAllToasts();
	});

	// ============================================================
	// Core Store Operations - add()
	// ============================================================
	describe('add()', () => {
		describe('Happy Path', () => {
			it('should add a toast with default type and duration', () => {
				const id = toastStore.add('Test message');
				const toasts = get(toastStore);
				expect(toasts).toHaveLength(1);
				expect(toasts[0]).toMatchObject({
					id,
					message: 'Test message',
					type: 'info',
					duration: 3000
				});
			});

			it('should add a toast with custom type', () => {
				toastStore.add('Error message', 'error');
				const toasts = get(toastStore);
				expect(toasts[0].type).toBe('error');
			});

			it('should add a toast with custom duration', () => {
				toastStore.add('Message', 'success', 5000);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(5000);
			});

			it('should return unique IDs for each toast', () => {
				const id1 = toastStore.add('First');
				const id2 = toastStore.add('Second');
				const id3 = toastStore.add('Third');
				expect(id1).not.toBe(id2);
				expect(id2).not.toBe(id3);
				expect(id1).not.toBe(id3);
			});

			it('should add multiple toasts', () => {
				toastStore.add('First');
				toastStore.add('Second');
				toastStore.add('Third');
				const toasts = get(toastStore);
				expect(toasts).toHaveLength(3);
			});

			it('should preserve toast order (FIFO)', () => {
				toastStore.add('First');
				toastStore.add('Second');
				toastStore.add('Third');
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe('First');
				expect(toasts[1].message).toBe('Second');
				expect(toasts[2].message).toBe('Third');
			});
		});

		describe('Edge Cases - Message Content', () => {
			it('should handle empty message', () => {
				const id = toastStore.add('');
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe('');
				expect(id).toBeDefined();
			});

			it('should handle whitespace-only message', () => {
				const id = toastStore.add('   ');
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe('   ');
				expect(id).toBeDefined();
			});

			it('should handle very long message (1000 chars)', () => {
				const longMessage = 'a'.repeat(1000);
				toastStore.add(longMessage);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(longMessage);
				expect(toasts[0].message.length).toBe(1000);
			});

			it('should handle very long message (10000 chars)', () => {
				const veryLongMessage = 'b'.repeat(10000);
				toastStore.add(veryLongMessage);
				const toasts = get(toastStore);
				expect(toasts[0].message.length).toBe(10000);
			});

			it('should handle message with newlines', () => {
				const message = 'Line 1\nLine 2\nLine 3';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle message with tabs', () => {
				const message = 'Tab\tSeparated\tValues';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle Unicode characters', () => {
				const message = 'Selamat datang di Portal Berita! 欢迎';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle emoji in message', () => {
				const message = '🎉 Success! Your article was published! 📰';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle special characters', () => {
				const message = '<script>alert("XSS")</script>';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle HTML entities', () => {
				const message = '&lt;div&gt;Hello&lt;/div&gt;';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});

			it('should handle Indonesian special characters', () => {
				const message = 'Artikel berhasil diterbitkan!';
				toastStore.add(message);
				const toasts = get(toastStore);
				expect(toasts[0].message).toBe(message);
			});
		});

		describe('Edge Cases - Duration', () => {
			it('should handle zero duration', () => {
				toastStore.add('Message', 'info', 0);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(0);
			});

			it('should handle negative duration', () => {
				toastStore.add('Message', 'info', -1000);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(-1000);
			});

			it('should handle very large duration', () => {
				const largeDuration = Number.MAX_SAFE_INTEGER;
				toastStore.add('Message', 'info', largeDuration);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(largeDuration);
			});

			it('should handle float duration', () => {
				toastStore.add('Message', 'info', 3000.5);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(3000.5);
			});

			it('should handle Infinity duration', () => {
				toastStore.add('Message', 'info', Infinity);
				const toasts = get(toastStore);
				expect(toasts[0].duration).toBe(Infinity);
			});
		});

		describe('All Toast Types', () => {
			const toastTypes: ToastType[] = ['success', 'error', 'warning', 'info'];

			toastTypes.forEach((type) => {
				it(`should correctly set type to '${type}'`, () => {
					toastStore.add('Message', type);
					const toasts = get(toastStore);
					expect(toasts[0].type).toBe(type);
				});
			});
		});
	});

	// ============================================================
	// Core Store Operations - remove()
	// ============================================================
	describe('remove()', () => {
		describe('Happy Path', () => {
			it('should remove a toast by ID', () => {
				const id = toastStore.add('To remove');
				expect(get(toastStore)).toHaveLength(1);
				toastStore.remove(id);
				expect(get(toastStore)).toHaveLength(0);
			});

			it('should not affect other toasts when removing one', () => {
				const id1 = toastStore.add('Keep this');
				const id2 = toastStore.add('Remove this');
				const id3 = toastStore.add('Keep this too');

				toastStore.remove(id2);

				const toasts = get(toastStore);
				expect(toasts).toHaveLength(2);
				expect(toasts.find((t) => t.id === id1)).toBeDefined();
				expect(toasts.find((t) => t.id === id2)).toBeUndefined();
				expect(toasts.find((t) => t.id === id3)).toBeDefined();
			});

			it('should handle removing non-existent ID gracefully', () => {
				toastStore.add('Existing toast');
				toastStore.remove('non-existent-id');
				expect(get(toastStore)).toHaveLength(1);
			});

			it('should handle removing from empty store', () => {
				expect(() => toastStore.remove('any-id')).not.toThrow();
				expect(get(toastStore)).toHaveLength(0);
			});

			it('should handle removing same ID twice', () => {
				const id = toastStore.add('Toast');
				toastStore.remove(id);
				toastStore.remove(id); // Second removal
				expect(get(toastStore)).toHaveLength(0);
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty string ID', () => {
				toastStore.add('Toast');
				toastStore.remove('');
				expect(get(toastStore)).toHaveLength(1);
			});

			it('should handle whitespace ID', () => {
				toastStore.add('Toast');
				toastStore.remove('   ');
				expect(get(toastStore)).toHaveLength(1);
			});

			it('should handle ID with special characters', () => {
				toastStore.add('Toast');
				toastStore.remove('!@#$%^&*()');
				expect(get(toastStore)).toHaveLength(1);
			});

			it('should handle very long ID string', () => {
				toastStore.add('Toast');
				toastStore.remove('a'.repeat(1000));
				expect(get(toastStore)).toHaveLength(1);
			});

			it('should preserve order after removal', () => {
				toastStore.add('First');
				const id2 = toastStore.add('Second');
				toastStore.add('Third');

				toastStore.remove(id2);

				const toasts = get(toastStore);
				expect(toasts[0].message).toBe('First');
				expect(toasts[1].message).toBe('Third');
			});
		});
	});

	// ============================================================
	// Convenience Functions
	// ============================================================
	describe('showSuccess()', () => {
		it('should add success toast with correct type', () => {
			showSuccess('Success!');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('success');
			expect(toasts[0].message).toBe('Success!');
		});

		it('should use default duration of 3000ms', () => {
			showSuccess('Success!');
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(3000);
		});

		it('should accept custom duration', () => {
			showSuccess('Success!', 5000);
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(5000);
		});

		it('should return toast ID', () => {
			const id = showSuccess('Success!');
			expect(typeof id).toBe('string');
			expect(id).toBeDefined();
		});

		it('should handle empty message', () => {
			showSuccess('');
			const toasts = get(toastStore);
			expect(toasts[0].message).toBe('');
			expect(toasts[0].type).toBe('success');
		});
	});

	describe('showError()', () => {
		it('should add error toast with correct type', () => {
			showError('Error!');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('error');
			expect(toasts[0].message).toBe('Error!');
		});

		it('should use default duration of 4000ms', () => {
			showError('Error!');
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(4000);
		});

		it('should accept custom duration', () => {
			showError('Error!', 6000);
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(6000);
		});

		it('should return toast ID', () => {
			const id = showError('Error!');
			expect(typeof id).toBe('string');
		});

		it('should handle Indonesian error message', () => {
			showError('Terjadi kesalahan! Silakan coba lagi.');
			const toasts = get(toastStore);
			expect(toasts[0].message).toBe('Terjadi kesalahan! Silakan coba lagi.');
		});
	});

	describe('showWarning()', () => {
		it('should add warning toast with correct type', () => {
			showWarning('Warning!');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('warning');
			expect(toasts[0].message).toBe('Warning!');
		});

		it('should use default duration of 3000ms', () => {
			showWarning('Warning!');
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(3000);
		});

		it('should accept custom duration', () => {
			showWarning('Warning!', 4500);
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(4500);
		});

		it('should return toast ID', () => {
			const id = showWarning('Warning!');
			expect(typeof id).toBe('string');
		});
	});

	describe('showInfo()', () => {
		it('should add info toast with correct type', () => {
			showInfo('Info!');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('info');
			expect(toasts[0].message).toBe('Info!');
		});

		it('should use default duration of 3000ms', () => {
			showInfo('Info!');
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(3000);
		});

		it('should accept custom duration', () => {
			showInfo('Info!', 2000);
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(2000);
		});

		it('should return toast ID', () => {
			const id = showInfo('Info!');
			expect(typeof id).toBe('string');
		});
	});

	describe('showNotification()', () => {
		it('should add notification with specified type', () => {
			showNotification('Notification', 'warning');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('warning');
		});

		it('should default to info type', () => {
			showNotification('Notification');
			const toasts = get(toastStore);
			expect(toasts[0].type).toBe('info');
		});

		it('should accept custom duration', () => {
			showNotification('Notification', 'success', 7000);
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(7000);
		});

		it('should use default duration of 3000ms', () => {
			showNotification('Notification', 'error');
			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(3000);
		});

		it('should return toast ID', () => {
			const id = showNotification('Test');
			expect(typeof id).toBe('string');
		});

		it('should work with all toast types', () => {
			showNotification('Success', 'success');
			showNotification('Error', 'error');
			showNotification('Warning', 'warning');
			showNotification('Info', 'info');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(4);
			expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'warning', 'info']);
		});
	});

	// ============================================================
	// Store Subscription
	// ============================================================
	describe('Store Subscription', () => {
		it('should allow subscribing to changes', () => {
			let currentToasts: ToastMessage[] = [];
			const unsubscribe = toastStore.subscribe((toasts) => {
				currentToasts = toasts;
			});

			expect(currentToasts).toHaveLength(0);

			toastStore.add('Test');
			expect(currentToasts).toHaveLength(1);

			unsubscribe();
		});

		it('should stop receiving updates after unsubscribe', () => {
			let updateCount = 0;
			const unsubscribe = toastStore.subscribe(() => {
				updateCount++;
			});

			// Initial subscription call
			const initialCount = updateCount;

			toastStore.add('Test 1');
			expect(updateCount).toBe(initialCount + 1);

			unsubscribe();

			toastStore.add('Test 2');
			expect(updateCount).toBe(initialCount + 1); // Should not increment
		});

		it('should support multiple subscribers', () => {
			let count1 = 0;
			let count2 = 0;

			const unsub1 = toastStore.subscribe(() => {
				count1++;
			});
			const unsub2 = toastStore.subscribe(() => {
				count2++;
			});

			const initial1 = count1;
			const initial2 = count2;

			toastStore.add('Test');

			expect(count1).toBe(initial1 + 1);
			expect(count2).toBe(initial2 + 1);

			unsub1();
			unsub2();
		});

		it('should receive correct toast data on update', () => {
			let receivedToasts: ToastMessage[] = [];
			const unsubscribe = toastStore.subscribe((toasts) => {
				receivedToasts = toasts;
			});

			toastStore.add('Test Message', 'success', 5000);

			expect(receivedToasts[0].message).toBe('Test Message');
			expect(receivedToasts[0].type).toBe('success');
			expect(receivedToasts[0].duration).toBe(5000);

			unsubscribe();
		});
	});

	// ============================================================
	// ID Generation
	// ============================================================
	describe('ID Generation', () => {
		it('should generate incrementing IDs', () => {
			const id1 = toastStore.add('First');
			const id2 = toastStore.add('Second');
			const id3 = toastStore.add('Third');

			// IDs should be incrementing numbers as strings
			expect(parseInt(id1)).toBeLessThan(parseInt(id2));
			expect(parseInt(id2)).toBeLessThan(parseInt(id3));
		});

		it('should generate string IDs', () => {
			const id = toastStore.add('Test');
			expect(typeof id).toBe('string');
		});

		it('should generate unique IDs across 1000 toasts', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 1000; i++) {
				ids.add(toastStore.add('Toast ' + i));
			}
			expect(ids.size).toBe(1000);
		});

		it('should maintain ID uniqueness after removals', () => {
			const id1 = toastStore.add('First');
			toastStore.remove(id1);
			const id2 = toastStore.add('Second');
			expect(id1).not.toBe(id2);
		});
	});

	// ============================================================
	// Stress Tests
	// ============================================================
	describe('Stress Tests', () => {
		it('should handle rapid add operations', () => {
			for (let i = 0; i < 100; i++) {
				toastStore.add('Toast ' + i);
			}
			expect(get(toastStore)).toHaveLength(100);
		});

		it('should handle rapid add/remove operations', () => {
			const ids: string[] = [];
			for (let i = 0; i < 50; i++) {
				ids.push(toastStore.add('Toast ' + i));
			}

			// Remove half
			for (let i = 0; i < 25; i++) {
				toastStore.remove(ids[i]);
			}

			expect(get(toastStore)).toHaveLength(25);
		});

		it('should handle add-remove-add cycle', () => {
			const id1 = toastStore.add('First');
			toastStore.remove(id1);
			const id2 = toastStore.add('Second');
			toastStore.remove(id2);
			const id3 = toastStore.add('Third');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].message).toBe('Third');
		});

		it('should handle interleaved add and remove', () => {
			toastStore.add('A');
			const idB = toastStore.add('B');
			toastStore.add('C');
			toastStore.remove(idB);
			toastStore.add('D');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(3);
			expect(toasts.map((t) => t.message)).toEqual(['A', 'C', 'D']);
		});

		it('should handle removing all toasts one by one', () => {
			const ids: string[] = [];
			for (let i = 0; i < 10; i++) {
				ids.push(toastStore.add('Toast ' + i));
			}

			ids.forEach((id) => toastStore.remove(id));

			expect(get(toastStore)).toHaveLength(0);
		});

		it('should handle 1000 toasts', () => {
			for (let i = 0; i < 1000; i++) {
				toastStore.add('Message ' + i, ['success', 'error', 'warning', 'info'][i % 4] as ToastType);
			}

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1000);
		});
	});

	// ============================================================
	// Real-world Scenarios
	// ============================================================
	describe('Real-world Scenarios', () => {
		it('should handle typical success workflow', () => {
			const id = showSuccess('Artikel berhasil diterbitkan!');
			const toasts = get(toastStore);

			expect(toasts[0].message).toBe('Artikel berhasil diterbitkan!');
			expect(toasts[0].type).toBe('success');
			expect(typeof id).toBe('string');
		});

		it('should handle typical error workflow', () => {
			showError('Gagal menyimpan artikel. Silakan coba lagi.');
			const toasts = get(toastStore);

			expect(toasts[0].type).toBe('error');
			expect(toasts[0].duration).toBe(4000); // Error has longer duration
		});

		it('should handle multiple notifications in sequence', () => {
			showInfo('Memproses...');
			showSuccess('Berhasil!');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(2);
			expect(toasts[0].message).toBe('Memproses...');
			expect(toasts[1].message).toBe('Berhasil!');
		});

		it('should handle form validation errors', () => {
			showError('Judul artikel harus diisi');
			showError('Konten artikel terlalu pendek');
			showError('Kategori belum dipilih');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(3);
			expect(toasts.every((t) => t.type === 'error')).toBe(true);
		});

		it('should allow dismissing a specific toast', () => {
			showInfo('Info 1');
			const errorId = showError('Dismissable error');
			showInfo('Info 2');

			toastStore.remove(errorId);

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(2);
			expect(toasts.every((t) => t.type === 'info')).toBe(true);
		});
	});

	// ============================================================
	// ToastMessage Interface Verification
	// ============================================================
	describe('ToastMessage Interface', () => {
		it('should have all required properties', () => {
			toastStore.add('Test', 'success', 5000);
			const toast = get(toastStore)[0];

			expect(toast).toHaveProperty('id');
			expect(toast).toHaveProperty('message');
			expect(toast).toHaveProperty('type');
			expect(toast).toHaveProperty('duration');
		});

		it('should have correct property types', () => {
			toastStore.add('Test', 'success', 5000);
			const toast = get(toastStore)[0];

			expect(typeof toast.id).toBe('string');
			expect(typeof toast.message).toBe('string');
			expect(typeof toast.type).toBe('string');
			expect(typeof toast.duration).toBe('number');
		});

		it('should not have extra properties', () => {
			toastStore.add('Test');
			const toast = get(toastStore)[0];
			const keys = Object.keys(toast);

			expect(keys).toHaveLength(4);
			expect(keys.sort()).toEqual(['duration', 'id', 'message', 'type']);
		});
	});
});
