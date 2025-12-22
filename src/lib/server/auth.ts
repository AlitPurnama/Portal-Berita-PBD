import type { RequestEvent } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { randomBytes as cryptoRandomBytes } from 'node:crypto';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = cryptoRandomBytes(16);
	const saltHex = encodeHexLowerCase(salt);
	const hash = await sha256(new TextEncoder().encode(password + saltHex));
	return saltHex + ':' + encodeHexLowerCase(hash);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	const [saltHex, hashHex] = passwordHash.split(':');
	if (!saltHex || !hashHex) return false;
	const hash = await sha256(new TextEncoder().encode(password + saltHex));
	return encodeHexLowerCase(hash) === hashHex;
}

export async function createUser(username: string, email: string, fullName: string, password: string) {
	const userId = encodeBase64url(cryptoRandomBytes(18));
	const passwordHash = await hashPassword(password);
	
	// Normalize email to lowercase for consistency
	const normalizedEmail = email.toLowerCase().trim();
	const normalizedUsername = username.trim();
	
	const newUser: table.User = {
		id: userId,
		username: normalizedUsername,
		email: normalizedEmail,
		fullName: fullName.trim(),
		passwordHash,
		aboutMe: null,
		age: null
	};
	
	await db.insert(table.user).values(newUser);
	return newUser;
}

export async function getUserByEmail(email: string) {
	// Normalize email to lowercase for case-insensitive lookup
	const normalizedEmail = email.toLowerCase().trim();
	// Use LOWER() for case-insensitive comparison in MySQL
	const [user] = await db
		.select()
		.from(table.user)
		.where(sql`LOWER(${table.user.email}) = ${normalizedEmail}`)
		.limit(1);
	return user;
}

export async function getUserByUsername(username: string) {
	const [user] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.username, username))
		.limit(1);
	return user;
}

export async function getUserByEmailOrUsername(identifier: string) {
	// Try to find by email first, then by username
	const userByEmail = await getUserByEmail(identifier);
	if (userByEmail) {
		return userByEmail;
	}
	return await getUserByUsername(identifier);
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username, email: table.user.email, fullName: table.user.fullName, aboutMe: table.user.aboutMe, profilePicture: table.user.profilePicture },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

export async function updateUser(userId: string, updates: { username?: string; email?: string; aboutMe?: string | null; profilePicture?: string | null }) {
	const updateData: Partial<table.User> = {};
	if (updates.username !== undefined) updateData.username = updates.username;
	if (updates.email !== undefined) updateData.email = updates.email;
	if (updates.aboutMe !== undefined) updateData.aboutMe = updates.aboutMe;
	if (updates.profilePicture !== undefined) updateData.profilePicture = updates.profilePicture;

	await db.update(table.user).set(updateData).where(eq(table.user.id, userId));
}

export async function updatePassword(userId: string, newPassword: string) {
	const passwordHash = await hashPassword(newPassword);
	await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, userId));
}

export async function deleteUser(userId: string) {
	// Delete in the correct order due to foreign key constraints
	// 1. Delete all comments by this user
	await db.delete(table.comment).where(eq(table.comment.userId, userId));
	
	// 2. Delete all comments on articles by this user
	const userArticles = await db
		.select({ id: table.article.id })
		.from(table.article)
		.where(eq(table.article.authorId, userId));
	
	for (const article of userArticles) {
		await db.delete(table.comment).where(eq(table.comment.articleId, article.id));
	}
	
	// 3. Delete all articles by this user
	await db.delete(table.article).where(eq(table.article.authorId, userId));
	
	// 4. Delete all sessions
	await db.delete(table.session).where(eq(table.session.userId, userId));
	
	// 5. Finally delete the user
	await db.delete(table.user).where(eq(table.user.id, userId));
}
