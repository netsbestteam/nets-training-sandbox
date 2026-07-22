import { ALERTS_SERVICE_URL } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

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

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const token = locals.user?.token;

		if (!token) {
			console.error('no token found in locals.user');
			return fail(401, { message: 'Unauthorized: Session missing token' });
		}

		const formData = await request.formData();
		const alertId = formData.get('alertId');
		const status = formData.get('status');

		console.log(`ATTEMPTING DB UPDATE: Alert ID: ${alertId}, Status: ${status}`);

		if (!alertId || !status) {
			console.error('missing alertId or status payload');
			console.log(formData);
			return fail(400, { message: 'Missing alert ID or target status' });
		}

		try {
			const url = `http://localhost:3001/alerts/${alertId}/status`;
			console.log(`🔗 Fetching URL: ${url}`);

			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ status })
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`BACKEND API REJECTED UPDATE (${response.status}):`, errorText);
				return fail(response.status, { errorFromBackend: errorText });
			}

			console.log('DATABASE UPDATE SUCCESSFUL AT BACKEND');
			return { success: true };
		} catch (error) {
			console.error('CRITICAL NETWORK ERROR CONNECTING TO API:', error);
			return fail(500, { message: 'Internal Server Error' });
		}
	}
};
