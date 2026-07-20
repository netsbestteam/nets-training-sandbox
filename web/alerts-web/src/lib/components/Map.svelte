<script lang="ts">
	import { onMount } from 'svelte';
	import type * as LeafletNamespace from 'leaflet';
	import type { Alert } from './TableColumns/AlertsColumns';

	let { alerts }: { alerts: Alert[] } = $props();

	let mapElement = $state<HTMLDivElement>();
	let markerLayer: any;
	let L = $state<typeof LeafletNamespace>();

	onMount(async () => {
		if (!mapElement) return;

		L = await import('leaflet');

		const map = L.map(mapElement).setView([31.4, 35.0], 8);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap &copy; CARTO'
		}).addTo(map);

		markerLayer = L.layerGroup().addTo(map);
	});

	const getSeverityColor = (sev: number) =>
		['#10b981', '#10b981', '#3b82f6', '#f97316', '#f97316', '#ef4444'][sev] || '#10b981';

	$effect(() => {
		const currentLayer = markerLayer;
		const leaflet = L;

		if (!currentLayer || !leaflet) return;
		currentLayer.clearLayers();

		alerts.forEach(({ location, camera_id, severity, status }) => {
			if (typeof location?.x !== 'number' || typeof location?.y !== 'number') return;

			const marker = leaflet!.circleMarker([location.y, location.x], {
				radius: 8,
				fillColor: getSeverityColor(severity),
				color: '#ffffff',
				weight: 1.5,
				fillOpacity: 0.8
			}).bindPopup(`
                <div style="color: #18181b; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                    <strong style="font-size: 13px;">Camera ID:</strong> ${camera_id}<br/>
                    <strong>Severity:</strong> ${severity}<br/>
                    <strong style="text-transform: capitalize;">Status:</strong> ${status}<br/>
                    <strong>Location:</strong> ${location.x.toFixed(4)}, ${location.y.toFixed(4)}
                </div>
            `);

			markerLayer.addLayer(marker);
		});
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div
	bind:this={mapElement}
	class="h-[610px] w-full rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md"
></div>
