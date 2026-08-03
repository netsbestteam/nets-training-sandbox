import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { KEYCLOAK_ID, KEYCLOAK_ISSUER } from '$env/static/private';
import { dev } from '$app/environment';
import { logger } from '#shared/backend/logger';

// helper function to create PKCE
function generateVerifier(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
	const array = new Uint8Array(43);
	crypto.getRandomValues(array);
	return Array.from(array, (x) => chars[x % chars.length]).join('');
}

async function generateChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	// convert to base64 url
	return btoa(String.fromCharCode(...hashArray))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

export const load: PageServerLoad = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	let shouldRedirect = false;

	if (code) {
		const codeVerifier = cookies.get('code_verifier');

		if (!codeVerifier) {
			return { error: 'Missing code verifier. Session expired.' };
		}

		try {
			const tokenResponse = await fetch(`${KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					client_id: KEYCLOAK_ID,
					code,
					redirect_uri: `${url.origin}/login`,
					code_verifier: codeVerifier
				})
			});

			if (!tokenResponse.ok) {
				const errText = await tokenResponse.text();
				logger.error('Keycloak token error details:' + errText);
				throw error(400, 'Failed to fetch tokens from Keycloak');
			}

			const tokens = await tokenResponse.json();

			// set the token in cookie
			cookies.set('session_token', tokens.access_token, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: tokens.expires_in
			});

			// clean the temporary PKCE
			cookies.delete('code_verifier', { path: '/' });

			shouldRedirect = true;
		} catch (err) {
			logger.error('Login error during token exchange:' + err);
			return { error: 'Authentication failed' };
		}
	}

	if (shouldRedirect) {
		throw redirect(303, '/');
	}

	// create new PKCE
	const verifier = generateVerifier();
	const challenge = await generateChallenge(verifier);

	// set the verifier for the next stage
	cookies.set('code_verifier', verifier, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: 300
	});

	const keycloakLoginUrl =
		`${KEYCLOAK_ISSUER}/protocol/openid-connect/auth?` +
		new URLSearchParams({
			client_id: KEYCLOAK_ID,
			response_type: 'code',
			redirect_uri: `${url.origin}/login`,
			scope: 'openid profile email',
			code_challenge: challenge,
			code_challenge_method: 'S256'
		});

	return { keycloakLoginUrl };
};
