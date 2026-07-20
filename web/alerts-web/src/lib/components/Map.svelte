<script lang="ts">
	import { onMount } from 'svelte';
	import type * as LeafletNamespace from 'leaflet';
	import type { Alert } from './TableColumns/AlertsColumns';

	let { alerts }: { alerts: Alert[] } = $props();

	let mapElement = $state<HTMLDivElement | undefined>(undefined);
	let map = $state<any>(null);
	let markerLayer = $state<any>(null);
	let L = $state<typeof LeafletNamespace | null>(null);

	onMount(async () => {
		if (!mapElement) return;
		const el = mapElement;

		L = await import('leaflet');

		map = L.map(el).setView([31.4, 35.0], 8);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
		}).addTo(map);

		markerLayer = L.layerGroup().addTo(map);
	});

	function getSeverityColor(severity: number): string {
		if (severity === 5) return '#ef4444';
		if (severity === 3 || severity === 4) return '#f97316';
		if (severity === 2) return '#3b82f6';
		return '#10b981';
	}

	$effect(() => {
		const currentAlerts = alerts;
		const currentLayer = markerLayer;
		const leaflet = L;

		if (!currentLayer || !leaflet) return;

		currentLayer.clearLayers();

		currentAlerts.forEach((alert) => {
			const lat = alert.location?.x;
			const lng = alert.location?.y;

			if (typeof lat !== 'number' || typeof lng !== 'number') return;

			const color = getSeverityColor(alert.severity);

			const marker = leaflet.circleMarker([lng, lat], {
				radius: 8,
				fillColor: color,
				color: '#ffffff',
				weight: 1.5,
				fillOpacity: 0.8
			});

			marker.bindPopup(`
                <div style="color: #18181b; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                    <strong style="font-size: 13px;">Camera ID:</strong> ${alert.camera_id}<br/>
                    <strong>Severity:</strong> ${alert.severity}<br/>
                    <strong>Status:</strong> <span style="text-transform: capitalize;">${alert.status}</span>
                </div>
            `);

			currentLayer.addLayer(marker);
		});
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
</svelte:head>

<div
	bind:this={mapElement}
	class="h-[610px] w-full rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md"
></div>
