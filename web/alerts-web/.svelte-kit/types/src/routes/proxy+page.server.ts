// @ts-nocheck
import { ALERTS_SERVICE_URL } from '$env/static/private';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { logger } from '@shared-backend/logger/index';
import { UpdateAlertStatus } from '@shared/schemas/management';

const baseUrl = ALERTS_SERVICE_URL || 'http://localhost:3001';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
	if (!locals.user?.token) {
		throw error(401, 'Unauthorized');
	}

	const token = locals.user.token;

	try {
		const [alertsRes, investigatorsRes] = await Promise.all([
			fetch(`${baseUrl}/alerts`, {
				headers: { Authorization: `Bearer ${token}` }
			}),
			fetch(`${baseUrl}/investigators`, {
				headers: { Authorization: `Bearer ${token}` }
			})
		]);

		if (!alertsRes.ok) throw error(alertsRes.status, 'Failed to fetch alerts');

		const alerts = await alertsRes.json();
		const investigators = investigatorsRes.ok ? await investigatorsRes.json() : [];

		return {
			alerts,
			investigators
		};
	} catch (err) {
		logger.error('Error connecting to alerts service: ' + err);
		throw error(500, 'Alerts service is currently unavailable');
	}
};

export const actions = {
	updateStatus: async ({ request, locals }: import('./$types').RequestEvent) => {
		const token = locals.user?.token;

		if (!token) {
			logger.error('no token found in locals.user');
			return fail(401, { message: 'Unauthorized: Session missing token' });
		}

		const formData = await request.formData();
		const alertId = formData.get('alertId');

		const statusPayload = {
			status: formData.get('status')
		};

		if (!alertId) {
			logger.error('missing alertId payload');
			return fail(400, { message: 'Missing alert ID' });
		}

		const result = UpdateAlertStatus.safeParse(statusPayload);

		if (!result.success) {
			logger.error('Validation failed for alert status updates:' + result.error.flatten());
			return fail(400, {
				message: 'Invalid status value provided',
				errors: result.error.flatten().fieldErrors
			});
		}

		const { status } = result.data;

		logger.info(`ATTEMPTING DB UPDATE: Alert ID: ${alertId}, Status: ${status}`);

		try {
			const url = `${baseUrl}/alerts/${alertId}/status`;
			logger.info(`🔗 Fetching URL: ${url}`);

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
				logger.error(`BACKEND API REJECTED UPDATE (${response.status}): ` + errorText);
				return fail(response.status, { errorFromBackend: errorText });
			}

			logger.info('DATABASE UPDATE SUCCESSFUL AT BACKEND');
			return { success: true };
		} catch (error) {
			logger.error('CRITICAL NETWORK ERROR CONNECTING TO API: ' + error);
			return fail(500, { message: 'Internal Server Error' });
		}
	}
};
;null as any as Actions;