import { ALERTS_SERVICE_URL } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.token) {
		throw error(401, 'Unauthorized');
	}

	try {
		const response = await fetch(`${ALERTS_SERVICE_URL}/alerts`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${locals.user.token}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			console.log('Alerts service error:', await response.text());
			throw error(response.status, 'Failed to fetch alerts from service');
		}

		const alerts = await response.json();

		return {
			alerts
		};
	} catch (err) {
		console.log('Error connecting to alerts service:', err);
		throw error(500, 'Alerts service is currently unavailable');
	}
};
