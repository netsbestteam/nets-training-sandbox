<script lang="ts">
	import type { ColumnDef } from '@tanstack/svelte-table';
	import type { PageData } from './$types';
	import CustomTable from '$lib/components/CustomTable.svelte';
	import Map from '$lib/components/Map.svelte';

	interface Alert {
		alert_id: string;
		severity: number;
		alert_type: string | null;
		alert_time: string;
		status: string;
		location: { x: number; y: number };
		camera_id: string;
	}

	let { data }: { data: PageData } = $props();

	let showInactive = $state(false);

	let alertsData = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		if (showInactive) {
			return rawAlerts;
		}
		return rawAlerts.filter((alert) => alert.status !== 'inactive');
	});

	const columns: ColumnDef<Alert, any>[] = [
		{
			accessorKey: 'severity',
			header: 'SEVERITY',
			enableSorting: true,
			cell: (info) => {
				const value = Number(info.getValue());
				let label = `${value} - Unknown`;
				let classes = 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';

				if (value === 5) {
					label = '5 - Critical';
					classes = 'bg-red-500/10 text-red-400 ring-red-500/20';
				} else if (value === 3 || value === 4) {
					label = `${value} - High`;
					classes = 'bg-orange-500/10 text-orange-400 ring-orange-500/20';
				} else if (value === 2) {
					label = '2 - Medium';
					classes = 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
				} else if (value === 1) {
					label = '1 - Low';
					classes = 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
				}

				return `<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${classes}">${label}</span>`;
			}
		},
		{
			accessorKey: 'status',
			header: 'STATUS',
			cell: (info) => `
            <span class="capitalize px-2.5 py-1 rounded-full text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                ${info.getValue()}
            </span>
        `
		},
		{
			accessorKey: 'alert_time',
			header: 'DATE',
			enableSorting: true,
			cell: (info) =>
				new Date(info.getValue()).toLocaleString('he-IL', {
					dateStyle: 'short',
					timeStyle: 'medium'
				}),
			sortingFn: 'datetime'
		},
		{
			id: 'location',
			header: 'LOCATION (X, Y)',
			accessorFn: (row) => `${row.location.x}, ${row.location.y}`
		},
		{
			accessorKey: 'camera_id',
			header: 'CAMERA ID',
			cell: (info) =>
				`<span class="font-mono text-xs text-zinc-500 block truncate max-w-[150px]">${info.getValue()}</span>`
		}
	];

	let activeAlertsOnly = $derived(() => {
		const rawAlerts = (data.alerts as Alert[]) || [];
		return rawAlerts.filter((alert) => alert.status === 'active');
	});
</script>

<div class="space-y-6 p-8">
	<div
		class="flex flex-col items-center justify-between gap-4 border-b border-zinc-800 pb-5 sm:flex-row"
	>
		<h1 class="text-2xl font-bold tracking-wide text-white">Alerts Sandbox</h1>

		<label
			class="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/50"
		>
			<input
				type="checkbox"
				bind:checked={showInactive}
				class="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-zinc-950"
			/>
			<span>Show inactive alerts</span>
		</label>
	</div>
	<div class="flex gap-5">
		{#if alertsData().length > 0}
			<CustomTable data={alertsData()} {columns} />
		{:else}
			<div
				class="rounded-xl border border-zinc-800 bg-zinc-900/20 p-8 text-center text-sm text-zinc-500"
			>
				No alerts found.
			</div>
		{/if}

		<div class="w-1/2 space-y-2">
			<Map alerts={activeAlertsOnly()} />
		</div>
	</div>
</div>
