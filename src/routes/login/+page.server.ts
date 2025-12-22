import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as auth from '$lib/server/auth';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';


export const actions: Actions = {
	login: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const identifier = formData.get('identifier')?.toString(); // Can be email or username
		const password = formData.get('password')?.toString();

		if (!identifier || !password) {
			return fail(400, { error: 'Username/Email dan password wajib diisi' });
		}

		// Try to find user by email or username
		const user = await auth.getUserByEmailOrUsername(identifier);
		if (!user) {
			return fail(401, { error: 'Username/Email atau password salah' });
		}

		const isValidPassword = await auth.verifyPassword(password, user.passwordHash);
		if (!isValidPassword) {
			return fail(401, { error: 'Username/Email atau password salah' });
		}

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);

		setSessionTokenCookie({ cookies, locals } as any, sessionToken, session.expiresAt);

		// Get redirect URL from query params
		const url = new URL(request.url);
		const redirectUrl = url.searchParams.get('redirect') || '/';

		throw redirect(302, redirectUrl);
	},

	register: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString();
		const email = formData.get('email')?.toString();
		const fullName = formData.get('fullName')?.toString();
		const password = formData.get('password')?.toString();
		const passwordRetype = formData.get('password-retype')?.toString();

		if (!username || !email || !fullName || !password || !passwordRetype) {
			return fail(400, { error: 'Semua field wajib diisi' });
		}

		if (password !== passwordRetype) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password harus minimal 6 karakter' });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Format email tidak valid' });
		}

		// Validate username format (alphanumeric, underscore, dash, 3-20 chars)
		const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
		if (!usernameRegex.test(username)) {
			return fail(400, { error: 'Username harus 3-20 karakter, hanya boleh huruf, angka, underscore (_), dan dash (-)' });
		}

		// Normalize email to lowercase for case-insensitive check
		const normalizedEmail = email.toLowerCase().trim();
		const normalizedUsername = username.trim();

		// Check if email already exists (case-insensitive)
		const existingUserByEmail = await auth.getUserByEmail(normalizedEmail);
		if (existingUserByEmail) {
			return fail(400, { error: 'Email sudah terdaftar' });
		}

		// Check if username already exists (case-sensitive for username)
		const existingUserByUsername = await auth.getUserByUsername(normalizedUsername);
		if (existingUserByUsername) {
			return fail(400, { error: 'Username sudah digunakan' });
		}

		try {
			// Use normalized values
			const user = await auth.createUser(normalizedUsername, normalizedEmail, fullName.trim(), password);
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, user.id);

			setSessionTokenCookie({ cookies, locals } as any, sessionToken, session.expiresAt);

			// Get redirect URL from query params
			const url = new URL(request.url);
			const redirectUrl = url.searchParams.get('redirect') || '/';

			throw redirect(302, redirectUrl);
		} catch (error: any) {
			// Re-throw redirect - it's not an error, it's the expected behavior
			if (error.status === 302 || error.status === 301 || error.status === 303 || error.status === 307 || error.status === 308) {
				throw error;
			}
			
			// Handle unique constraint violations from database
			if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
				// Check which field caused the duplicate
				if (error.message?.includes('username') || error.sqlMessage?.includes('username')) {
					return fail(400, { error: 'Username sudah digunakan' });
				}
				if (error.message?.includes('email') || error.sqlMessage?.includes('email')) {
					return fail(400, { error: 'Email sudah terdaftar' });
				}
				return fail(400, { error: 'Username atau email sudah digunakan' });
			}
			console.error('Registration error:', error);
			return fail(500, { error: 'Gagal mendaftar. Silakan coba lagi.' });
		}
	}
};

