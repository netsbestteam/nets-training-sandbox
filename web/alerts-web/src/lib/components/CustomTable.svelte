<script lang="ts" generics="T">
	import {
		createTable,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import type { ColumnDef, SortingState } from '@tanstack/table-core';

	let { data, columns }: { data: T[]; columns: ColumnDef<T, any>[] } = $props();

	let pagination = $state({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);

	const table = createTable<T>({
		data,
		columns,
		state: {
			sorting,
			pagination,
			columnPinning: {},
			columnVisibility: {},
			columnOrder: [],
			columnFilters: [],
			globalFilter: undefined,
			expanded: {},
			rowSelection: {},
			grouping: []
		},
		renderFallbackValue: null,
		onStateChange: () => {},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		}
	});

	// map the incoming columns to enable sorting rules
	$effect.pre(() => {
		const strictColumns = columns.map((col) => ({
			...col,
			enableSorting:
				col.id === 'date' ||
				(col as any).accessorKey === 'alert_time' ||
				col.id === 'severity' ||
				(col as any).accessorKey === 'severity' ||
				(col as any).accessorKey == 'status'
		}));

		table.setOptions((prev) => ({
			...prev,
			data,
			columns: strictColumns,
			state: {
				...prev.state,
				pagination,
				sorting
			}
		}));
	});

	let headerGroups = $derived.by(() => {
		data;
		return table.getHeaderGroups();
	});

	let rowModel = $derived.by(() => {
		data;
		pagination;
		sorting;
		return table.getRowModel();
	});

	let pageCount = $derived.by(() => {
		data;
		pagination;
		return table.getPageCount();
	});

	let canPrevious = $derived.by(() => {
		pagination;
		return table.getCanPreviousPage();
	});

	let canNext = $derived.by(() => {
		pagination;
		return table.getCanNextPage();
	});
</script>

<div class="w-1/2 space-y-4">
	<div class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
		<table class="w-full border-collapse text-left text-sm text-zinc-300">
			<thead
				class="border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase"
			>
				{#each headerGroups as headerGroup}
					<tr>
						{#each headerGroup.headers as header}
							<th class="px-6 py-4 font-medium">
								{#if !header.isPlaceholder}
									{#if header.column.getCanSort()}
										<button
											type="button"
											class="flex cursor-pointer items-center gap-1 tracking-wider uppercase transition hover:text-white"
											onclick={header.column.getToggleSortingHandler()}
										>
											{header.column.columnDef.header}

											{#if header.column.getIsSorted() === 'asc'}
												<span class="text-white">▲</span>
											{:else if header.column.getIsSorted() === 'desc'}
												<span class="text-white">▼</span>
											{:else}
												<span class="text-zinc-600 opacity-40">↕</span>
											{/if}
										</button>
									{:else}
										{header.column.columnDef.header}
									{/if}
								{/if}
							</th>
						{/each}
					</tr>
				{/each}
			</thead>

			<tbody class="divide-y divide-zinc-800/60">
				{#each rowModel.rows as row}
					<tr class="transition hover:bg-zinc-800/30">
						{#each row.getVisibleCells() as cell}
							<td class="px-6 py-4 whitespace-nowrap">
								{#if cell.column.columnDef.cell}
									{#if typeof cell.column.columnDef.cell === 'function'}
										{@html (cell.column.columnDef.cell as any)(cell.getContext())}
									{:else}
										{cell.column.columnDef.cell}
									{/if}
								{:else}
									{cell.getValue()}
								{/if}
							</td>
						{/each}
					</tr>
				{:else}
					<tr>
						<td colspan={columns.length} class="px-6 py-8 text-center text-zinc-500">
							No data available
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex items-center justify-between px-2 text-xs text-zinc-400">
		<div>
			Page <span class="font-medium text-white">{pagination.pageIndex + 1}</span> of
			<span class="font-medium text-white">{pageCount}</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
				onclick={() => table.previousPage()}
				disabled={!canPrevious}
			>
				Previous
			</button>
			<button
				type="button"
				class="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
				onclick={() => table.nextPage()}
				disabled={!canNext}
			>
				Next
			</button>
		</div>
	</div>
</div>
