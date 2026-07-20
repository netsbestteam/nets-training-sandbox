<script lang="ts">
	import type { PageData } from './$types';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import Map from '$lib/components/Map.svelte';
	import { columns, type Alert } from '$lib/components/TableColumns/AlertsColumns';

	let { data }: { data: PageData } = $props();

	let activeFilter = $state<string | null>(null);
	let searchQuery = $state('');

	let alertsData = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];

		const filters = [
			(alerts: Alert[]) => {
				if (!activeFilter) return alerts;
				if (activeFilter === 'open')
					return alerts.filter((a) => a.status === 'active' || a.status === 'open');
				if (activeFilter === 'closed')
					return alerts.filter((a) => a.status === 'inactive' || a.status === 'closed');
				if (activeFilter === 'critical') return alerts.filter((a) => a.severity === 5);
				return alerts;
			},

			(alerts: Alert[]) => {
				const query = searchQuery.trim().toLowerCase();
				if (!query) return alerts;

				return alerts.filter(
					(a) =>
						a.status.toLowerCase().includes(query) ||
						(a.alert_type && a.alert_type.toLowerCase().includes(query)) ||
						a.camera_id.toLowerCase().includes(query) ||
						a.severity.toString().includes(query)
				);
			}
		];

		return filters.reduce((currentData, applyFilter) => applyFilter(currentData), rawAlerts);
	});

	// derived states for summaries
	let activeAlertsOnly = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((alert) => alert.status === 'active' || alert.status === 'open');
	});

	let openAlertsCount = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.status === 'active' || a.status === 'open').length;
	});

	let closedAlertsCount = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.status === 'inactive' || a.status === 'closed').length;
	});

	let criticalAlertsCount = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((a) => a.severity === 5).length;
	});

	function toggleFilter(filterType: string) {
		if (activeFilter === filterType) {
			activeFilter = null;
		} else {
			activeFilter = filterType;
		}
	}
</script>

<div class="space-y-6 p-8">
	<div
		class="flex flex-col items-center justify-between gap-4 border-b border-zinc-800 pb-5 sm:flex-row"
	>
		<h1 class="text-2xl font-bold tracking-wide text-white">Alerts Sandbox</h1>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<button
			onclick={() => toggleFilter('open')}
			class="cursor-pointer rounded-xl border p-4 text-left backdrop-blur-md transition-all duration-200
                {activeFilter === 'open'
				? 'border-emerald-500/40 bg-emerald-950/10 shadow-lg ring-1 shadow-emerald-950/20 ring-emerald-500/20'
				: 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40'}"
		>
			<p class="text-xs font-medium tracking-wider text-zinc-400 uppercase">Open Alerts</p>
			<p class="mt-2 text-3xl font-bold text-white">{openAlertsCount()}</p>
		</button>

		<button
			onclick={() => toggleFilter('closed')}
			class="cursor-pointer rounded-xl border p-4 text-left backdrop-blur-md transition-all duration-200
                {activeFilter === 'closed'
				? 'border-zinc-500/40 bg-zinc-800/20 shadow-lg ring-1 ring-zinc-500/20'
				: 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40'}"
		>
			<p class="text-xs font-medium tracking-wider text-zinc-400 uppercase">Closed Alerts</p>
			<p class="mt-2 text-3xl font-bold text-zinc-300">{closedAlertsCount()}</p>
		</button>

		<button
			onclick={() => toggleFilter('critical')}
			class="cursor-pointer rounded-xl border p-4 text-left backdrop-blur-md transition-all duration-200
                {activeFilter === 'critical'
				? 'border-red-500/40 bg-red-950/20 shadow-lg ring-1 shadow-red-950/20 ring-red-500/20'
				: 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40'}"
		>
			<p class="text-xs font-medium tracking-wider text-red-400/80 uppercase">Critical Alerts</p>
			<p class="mt-2 text-3xl font-bold text-red-400">{criticalAlertsCount()}</p>
		</button>
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
		{#if alertsData().length > 0}
			<CustomTable data={alertsData()} {columns} />
		{:else}
			<div
				class="w-full rounded-xl border border-zinc-800 bg-zinc-900/20 p-8 text-center text-sm text-zinc-500"
			>
				No alerts found matching this selection.
			</div>
		{/if}

		<div class="w-1/2 space-y-2">
			<Map alerts={activeAlertsOnly()} />
		</div>
	</div>
</div>
