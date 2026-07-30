// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { KEYCLOAK_ISSUER } from '$env/static/private';

export const load = ({ cookies, url }: Parameters<PageServerLoad>[0]) => {
	cookies.delete('session_token', { path: '/' });

	const keycloakLogoutUrl =
		`${KEYCLOAK_ISSUER}/protocol/openid-connect/logout?` +
		new URLSearchParams({
			post_logout_redirect_uri: `${url.origin}/login`,
			client_id: 'public'
		});

	throw redirect(307, keycloakLogoutUrl);
};
