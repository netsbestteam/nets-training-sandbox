<script lang="ts">
	import { onMount } from 'svelte';
	import type * as LeafletNamespace from 'leaflet';

	interface Alert {
		alert_id: string;
		severity: number;
		status: string;
		location: { x: number; y: number };
		camera_id: string;
	}

	let { alerts }: { alerts: Alert[] } = $props();

	let mapElement: HTMLDivElement;
	let map: any;
	let markerLayer: any;

	let L: typeof LeafletNamespace;

	onMount(async () => {
		const leafletModule = await import('leaflet');
		L = leafletModule.default ?? leafletModule; // Safeguard for bundler variations

		map = L.map(mapElement).setView([31.4, 35.0], 8);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
		}).addTo(map);

		markerLayer = L.layerGroup().addTo(map);
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

<!-- Map Container Container Element -->
<div
	bind:this={mapElement}
	class="h-[500px] w-full rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md"
></div>
