<script lang="ts">
	let {
		assigned = $bindable(),
		pool = []
	}: {
		assigned: string[];
		pool: string[];
	} = $props();

	let dropdownOpen = $state(false);
	let availablePool = $derived(pool.filter((name) => !assigned.includes(name)));

	function addInvestigator(name: string) {
		if (name && !assigned.includes(name)) {
			assigned.push(name);
			dropdownOpen = false;
		}
	}
</script>

<div class="relative w-full">
	{#if assigned.length === 0}
		<div class="flex flex-col items-center justify-center py-6 text-center">
			<p class="mb-3 text-xs text-zinc-500">No investigators assigned to this alert.</p>
			<button
				type="button"
				data-vaul-no-drag
				onclick={() => (dropdownOpen = !dropdownOpen)}
				class="mx-auto flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
			>
				+ Assign First Investigator
			</button>
		</div>
	{:else}
		<div class="mt-2 border-t border-zinc-900 pt-2">
			<button
				type="button"
				data-vaul-no-drag
				onclick={() => (dropdownOpen = !dropdownOpen)}
				class="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800"
			>
				<span>+ Add another investigator...</span>
				<span class="text-[10px] text-zinc-600">{dropdownOpen ? '▲' : '▼'}</span>
			</button>
		</div>
	{/if}

	{#if dropdownOpen}
		<div
			data-vaul-no-drag
			class="absolute left-1/2 z-50 mt-1 max-h-[160px] w-full max-w-sm -translate-x-1/2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl"
		>
			{#if availablePool.length === 0}
				<div class="px-3 py-2 text-center text-xs text-zinc-600">All investigators assigned</div>
			{:else}
				{#each availablePool as name}
					<button
						type="button"
						onclick={() => addInvestigator(name)}
						class="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
					>
						{name}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
