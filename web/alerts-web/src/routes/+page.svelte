<script lang="ts">
	import type { ColumnDef } from '@tanstack/svelte-table';
	import type { PageData } from './$types';
	import CustomTable from '$lib/components/CustomTable.svelte';

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

	let alertsData = $derived((data.alerts as Alert[]) || []);

	const columns: ColumnDef<Alert, any>[] = [
		{
			accessorKey: 'severity',
			header: 'SEVERITY',
			cell: (info) => {
				const val = info.getValue();
				const color = val >= 5 ? 'text-red-500 font-bold' : 'text-amber-500 font-medium';
				return `<span class="${color}">${val}</span>`;
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
			cell: (info) =>
				new Date(info.getValue()).toLocaleString('he-IL', {
					dateStyle: 'short',
					timeStyle: 'medium'
				})
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
</script>

<div class="space-y-6 p-8">
	<div class="text-center">
		<h1 class="text-2xl font-bold tracking-wide text-white">Alerts Sandbox</h1>
	</div>

	{#if alertsData.length > 0}
		<CustomTable data={alertsData} {columns} />
	{:else}
		<div
			class="rounded-xl border border-zinc-800 bg-zinc-900/20 p-8 text-center text-sm text-zinc-500"
		>
			לא נמצאו התראות במערכת.
		</div>
	{/if}
</div>
