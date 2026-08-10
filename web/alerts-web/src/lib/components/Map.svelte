<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import type * as LeafletNamespace from 'leaflet';

	import 'leaflet/dist/leaflet.css';

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

	let mapInstance = $state<LeafletNamespace.Map>();
	let markerLayer = $state<LeafletNamespace.LayerGroup>();
	let L = $state<typeof LeafletNamespace>();

	let markerMap = new Map<string, LeafletNamespace.CircleMarker>();

	onMount(async () => {
		if (!mapElement) return;

		L = (await import('leaflet')).default;
		delete (L.Icon.Default.prototype as any)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
		});

		mapInstance = L.map(mapElement).setView(center, zoom);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap &copy; CARTO'
		}).addTo(mapInstance);

		markerLayer = L.layerGroup().addTo(mapInstance);

		setTimeout(() => {
			mapInstance?.invalidateSize();
		}, 50);
	});

	$effect(() => {
		const currentLayer = markerLayer;
		const leaflet = L;
		const currentItems = items;

		if (!currentLayer || !leaflet) return;

		currentLayer.clearLayers();
		markerMap.clear();

		currentItems.forEach((item) => {
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
			const latLng = marker!.getLatLng();

			map.flyTo(latLng, 14, {
				duration: 1.2
			});

			map.once('moveend', () => {
				marker!.openPopup();
			});
		}
	});
</script>

<div
	bind:this={mapElement}
	class="h-full min-h-[400px] w-full rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md"
></div>
