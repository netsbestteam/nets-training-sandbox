import type { Alert } from '$lib/components/TableColumns/AlertsColumns';

class AlertsStore {
	#alerts = $state<Alert[]>([]);

	constructor(initialAlerts: Alert[] = []) {
		this.#alerts = initialAlerts.map(this.#normalize);
	}

	get all() {
		return this.#alerts;
	}

	set all(newAlerts: Alert[]) {
		this.#alerts = newAlerts.map(this.#normalize);
	}

	setAlerts(newAlerts: Alert[]) {
		this.#alerts = newAlerts.map(this.#normalize);
	}

	add(rawPayload: any) {
		const data = rawPayload?.data?.[0] ?? rawPayload;
		if (!data || typeof data !== 'object') return;

		const incomingId = data.alert_id || data.id;
		if (!incomingId) return;

		const exists = this.#alerts.some((a) => a.alert_id === incomingId);
		if (exists) return;

		this.#alerts = [this.#normalize(data), ...this.#alerts];
	}

	#normalize(raw: any): Alert {
		return {
			...raw,
			camera_id: raw.camera_id ?? raw.cameraId,
			alert_type: raw.alert_type ?? raw.alertType,
			status: raw.status || 'open',
			severity: raw.severity !== undefined ? Number(raw.severity) : 0,
			created_at: raw.created_at || raw.alert_time || new Date().toISOString(),
			location: raw.location
				? {
						x: Number(raw.location.x ?? raw.location.lng),
						y: Number(raw.location.y ?? raw.location.lat)
					}
				: undefined
		};
	}
}

export function createAlertsStore(initialData: Alert[]) {
	return new AlertsStore(initialData);
}
