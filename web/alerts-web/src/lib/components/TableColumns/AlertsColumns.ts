import type { ColumnDef } from '@tanstack/svelte-table';

export interface Alert {
	alert_id: string;
	severity: number;
	alert_type: string | null;
	alert_time: string;
	status: string;
	location: { x: number; y: number };
	camera_id: string;
}

export const columns: ColumnDef<Alert, any>[] = [
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
		enableSorting: true,
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
		cell: (info) => {
			const raw = info.getValue();
			if (!raw) return '';

			const [datePart, timePart] = raw.split('T');
			const [year, month, day] = datePart.split('-');
			const time = timePart.split('.')[0]; // remove millis

			return `${day}/${month}/${year}, ${time}`;
		},
		sortingFn: 'datetime'
	},
	{
		accessorKey: 'alert_type',
		header: 'TYPE',
		enableSorting: true,
		cell: (info) =>
			`<span class="font-mono text-xs text-zinc-500 block truncate max-w-[150px]">${info.getValue()}</span>`
	}
];
