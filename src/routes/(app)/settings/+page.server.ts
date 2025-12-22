import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		const returnUrl = url.pathname;
		throw redirect(302, `/login?redirect=${encodeURIComponent(returnUrl)}`);
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Anda harus login untuk mengupdate profil' });
		}

		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const email = formData.get('email')?.toString();
		const fullName = formData.get('fullName')?.toString();
		const aboutMe = formData.get('aboutme')?.toString() || null;
		const profilePicture = formData.get('profilePicture')?.toString() || null;

		if (!username || !email || !fullName) {
			return fail(400, { error: 'Username, email, dan nama lengkap wajib diisi' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Username harus minimal 3 karakter' });
		}

		// Check if username or email already exists (excluding current user)
		const [existingUsername] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username))
			.limit(1);

		if (existingUsername && existingUsername.id !== locals.user.id) {
			return fail(400, { error: 'Username sudah digunakan' });
		}

		const [existingEmail] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email))
			.limit(1);

		if (existingEmail && existingEmail.id !== locals.user.id) {
			return fail(400, { error: 'Email sudah digunakan' });
		}

		try {
			await auth.updateUser(locals.user.id, {
				username,
				email,
				fullName,
				aboutMe: aboutMe && aboutMe.length > 0 ? aboutMe : null,
				profilePicture: profilePicture && profilePicture.length > 0 ? profilePicture : null
			});

			return { success: true, message: 'Profil berhasil diperbarui' };
		} catch (error: any) {
			console.error('Error updating profile:', error);
			return fail(500, { error: 'Gagal memperbarui profil. Silakan coba lagi.' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Anda harus login untuk mengupdate password' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('current-password')?.toString();
		const newPassword = formData.get('new-password')?.toString();
		const confirmPassword = formData.get('confirm-password')?.toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'Semua field password wajib diisi' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Password baru dan konfirmasi password tidak cocok' });
		}

		if (newPassword.length < 6) {
			return fail(400, { error: 'Password baru harus minimal 6 karakter' });
		}

		// Get current user with password hash
		const [user] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, locals.user.id))
			.limit(1);

		if (!user) {
			return fail(404, { error: 'User tidak ditemukan' });
		}

		// Verify current password
		const isValidPassword = await auth.verifyPassword(currentPassword, user.passwordHash);
		if (!isValidPassword) {
			return fail(401, { error: 'Password saat ini tidak benar' });
		}

		try {
			await auth.updatePassword(locals.user.id, newPassword);
			return { success: true, message: 'Password berhasil diperbarui' };
		} catch (error: any) {
			console.error('Error updating password:', error);
			return fail(500, { error: 'Gagal memperbarui password. Silakan coba lagi.' });
		}
	},

	deleteAccount: async (event) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Anda harus login untuk menghapus akun' });
		}

		const formData = await event.request.formData();
		const confirmText = formData.get('confirmText')?.toString();

		// Require confirmation text
		if (confirmText !== 'HAPUS') {
			return fail(400, { error: 'Silakan ketik HAPUS untuk konfirmasi' });
		}

		try {
			// Use the deleteUser function from auth which handles cascading deletes
			// Delete user (this will cascade delete sessions, articles, and comments)
			await auth.deleteUser(event.locals.user.id);

			// Delete session cookie
			auth.deleteSessionTokenCookie(event);

			throw redirect(302, '/');
		} catch (error: any) {
			if (error.status === 302) {
				throw error; // Re-throw redirect
			}
			console.error('Error deleting account:', error);
			
			// Provide more specific error messages
			let errorMessage = 'Gagal menghapus akun. Silakan coba lagi.';
			if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message?.includes('foreign key constraint')) {
				errorMessage = 'Tidak dapat menghapus akun karena masih ada data yang terkait. Silakan hubungi administrator.';
			}
			
			return fail(500, { error: errorMessage });
		}
	}
};

