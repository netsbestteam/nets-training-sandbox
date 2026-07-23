<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import type * as LeafletNamespace from 'leaflet';

	interface Props {
		items: T[];
		getLat: (item: T) => number | undefined;
		getLng: (item: T) => number | undefined;
		getMarkerColor?: (item: T) => string;
		getPopupHtml: (item: T) => string;
		center?: [number, number];
		zoom?: number;
		activeAlertId?: string | null;
		getItemId?: (item: T) => string | null;
	}

	let {
		items,
		getLat,
		getLng,
		getPopupHtml,
		getMarkerColor = () => '#3b82f6',
		center = [31.4, 35.0],
		zoom = 8,
		activeAlertId = null,
		getItemId = (item: any) => item?.alert_id
	}: Props = $props();

	let mapElement = $state<HTMLDivElement>();
	let markerLayer: any;
	let mapInstance: any;
	let L = $state<typeof LeafletNamespace>();

	// dictionary to keep track of active marker instances by their ID
	let markerMap = new Map<string, any>();

	onMount(async () => {
		if (!mapElement) return;

		L = (await import('leaflet')).default;
		mapInstance = L.map(mapElement).setView(center, zoom);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap &copy; CARTO'
		}).addTo(mapInstance);

		markerLayer = L.layerGroup().addTo(mapInstance);
	});

	$effect(() => {
		const currentLayer = markerLayer;
		const leaflet = L;

		if (!currentLayer || !leaflet) return;
		currentLayer.clearLayers();
		markerMap.clear(); // clear local tracking cache on fresh updates

		items.forEach((item) => {
			const lat = getLat(item);
			const lng = getLng(item);

			if (typeof lat !== 'number' || typeof lng !== 'number') return;

			const marker = leaflet
				.circleMarker([lat, lng], {
					radius: 8,
					fillColor: getMarkerColor(item),
					color: '#ffffff',
					weight: 1.5,
					fillOpacity: 0.8
				})
				.bindPopup(getPopupHtml(item));

			currentLayer.addLayer(marker);

			const id = getItemId(item);
			if (id) {
				markerMap.set(id, marker);
			}
		});
	});

	$effect(() => {
		const targetId = activeAlertId;
		const map = mapInstance;

		if (targetId && map && markerMap.has(targetId)) {
			const marker = markerMap.get(targetId);
			const latLng = marker.getLatLng();

			map.flyTo(latLng, 14, {
				duration: 1.2
			});

			map.once('moveend', () => {
				marker.openPopup();
			});
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div
	bind:this={mapElement}
	class="h-full min-h-[400px] w-full rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md"
></div>
