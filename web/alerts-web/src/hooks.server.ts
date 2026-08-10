import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session_token');
	const isLoginPath = event.url.pathname === '/login';

	if (!isLoginPath && !sessionToken) {
		throw redirect(307, '/login');
	}

	if (isLoginPath && sessionToken) {
		throw redirect(307, '/');
	}

	if (sessionToken) {
		event.locals.user = {
			token: sessionToken
		};
	} else {
		event.locals.user = null;
	}

	return await resolve(event);
};
