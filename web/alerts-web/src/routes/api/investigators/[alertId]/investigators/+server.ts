import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '@shared-backend/logger/index';
import { env } from '$env/dynamic/public';
import { ALERTS_SERVICE_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, locals }) => {
	const token = locals.user?.token;
	if (!token) {
		throw error(401, 'Unauthorized');
	}

	try {
		const baseUrl = ALERTS_SERVICE_URL || 'http://localhost:3001';

		const response = await fetch(`${baseUrl}/investigators/${params.alertId}/investigators`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch assigned investigators');
		}

		const data = await response.json();

		return json(data);
	} catch (err) {
		logger.error('Error fetching alert investigators:' + err);
		throw error(500, 'Internal Server Error');
	}
};
