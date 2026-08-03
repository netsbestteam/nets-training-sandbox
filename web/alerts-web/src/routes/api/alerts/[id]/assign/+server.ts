import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '@shared-backend/logger/index';
import { ALERTS_SERVICE_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const token = locals.user?.token;
	if (!token) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const baseUrl = ALERTS_SERVICE_URL || 'http://localhost:3001';

		const response = await fetch(`${baseUrl}/alerts/${params.id}/assign`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				investigatorIds: body.investigatorIds
			})
		});

		if (!response.ok) {
			throw error(response.status, 'Failed to save assignments on backend');
		}

		return json({ success: true });
	} catch (err) {
		logger.error('Proxy assignment error:' + err);
		throw error(500, 'Internal Server Error');
	}
};
