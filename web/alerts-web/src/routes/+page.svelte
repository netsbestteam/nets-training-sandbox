<script lang="ts">
	import type { PageData } from './$types';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import Map from '$lib/components/Map.svelte';
	import { columns, type Alert } from '$lib/components/TableColumns/AlertsColumns';
	import Card from '$lib/components/Card.svelte';
	import { closedStyles, criticalStyles, openStyles } from '$lib/styles/CardStyles';

	let { data }: { data: PageData } = $props();

	let activeFilter = $state<string | null>(null);
	let searchQuery = $state('');

	let alertsData = $derived.by(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		const query = searchQuery.trim().toLowerCase();

		let filtered = rawAlerts;
		if (activeFilter === 'open') {
			filtered = filtered.filter((a) => a.status === 'active' || a.status === 'open');
		} else if (activeFilter === 'closed') {
			filtered = filtered.filter((a) => a.status === 'inactive' || a.status === 'closed');
		} else if (activeFilter === 'critical') {
			filtered = filtered.filter((a) => a.severity === 5);
		}

		if (query) {
			filtered = filtered.filter((a) => {
				const status = a.status ? String(a.status).toLowerCase() : '';
				const alertType = a.alert_type ? String(a.alert_type).toLowerCase() : '';
				const cameraId = a.camera_id ? String(a.camera_id).toLowerCase() : '';
				const severity = a.severity !== undefined && a.severity !== null ? String(a.severity) : '';

				return (
					status.includes(query) ||
					alertType.includes(query) ||
					cameraId.includes(query) ||
					severity.includes(query)
				);
			});
		}

		return filtered;
	});

	let activeAlertsOnly = $derived.by(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((alert) => alert.status === 'active' || alert.status === 'open');
	});

	let openAlertsCount = $derived.by(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.status === 'active' || a.status === 'open').length;
	});

	let closedAlertsCount = $derived.by(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.status === 'inactive' || a.status === 'closed').length;
	});

	let criticalAlertsCount = $derived.by(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.severity === 5).length;
	});

	function toggleFilter(filterType: string) {
		activeFilter = activeFilter === filterType ? null : filterType;
	}
</script>

<div class="space-y-6 p-8">
	<div
		class="flex flex-col items-center justify-between gap-4 border-b border-zinc-800 pb-5 sm:flex-row"
	>
		<h1 class="text-2xl font-bold tracking-wide text-white">Alerts Sandbox</h1>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card
			label="Open Alerts"
			count={openAlertsCount}
			isActive={activeFilter === 'open'}
			style={openStyles}
			onclick={() => toggleFilter('open')}
		/>

		<Card
			label="Closed Alerts"
			count={closedAlertsCount}
			isActive={activeFilter === 'closed'}
			style={closedStyles}
			onclick={() => toggleFilter('closed')}
		/>

		<Card
			label="Critical Alerts"
			count={criticalAlertsCount}
			isActive={activeFilter === 'critical'}
			style={criticalStyles}
			onclick={() => toggleFilter('critical')}
		/>
	</div>

	<div class="w-full">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Filter by anything"
			class="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 transition outline-none focus:border-zinc-700 focus:bg-zinc-900/60"
		/>
	</div>

	<div class="flex gap-5">
		{#if alertsData.length > 0}
			<CustomTable data={alertsData} {columns} />
		{:else}
			<div
				class="w-full rounded-xl border border-zinc-800 bg-zinc-900/20 p-8 text-center text-sm text-zinc-500"
			>
				No alerts found matching this selection.
			</div>
		{/if}

		<div class="w-1/2 space-y-2">
			<Map alerts={activeAlertsOnly} />
		</div>
	</div>
</div>
