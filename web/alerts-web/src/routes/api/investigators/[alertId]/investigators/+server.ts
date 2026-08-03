import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '@shared-backend/logger/index';

export const GET: RequestHandler = async ({ params, locals }) => {
	const token = locals.user?.token;
	if (!token) {
		throw error(401, 'Unauthorized');
	}

	try {
		const response = await fetch(
			`http://localhost:3001/investigators/${params.alertId}/investigators`,
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

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
