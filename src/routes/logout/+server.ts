import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as auth from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		await auth.invalidateSession(event.locals.session.id);
	}
	auth.deleteSessionTokenCookie(event);
	throw redirect(302, '/');
};

