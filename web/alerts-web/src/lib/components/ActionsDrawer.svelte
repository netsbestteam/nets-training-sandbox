<script lang="ts">
	import { Drawer } from 'vaul-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { logger } from '@shared-backend/logger/index';
	import type { Alert } from './TableColumns/AlertsColumns';

	export interface Investigator {
		investigator_id: string;
		full_name: string;
		team: string;
		is_active: boolean;
	}

	let {
		open = $bindable(false),
		alert = $bindable(),
		onstatusupdate,
		investigators,
		onLocate
	}: {
		open: boolean;
		alert: Alert | null;
		onstatusupdate: (alertId: string, nextStatus: string) => void;
		investigators: Investigator[];
		onLocate?: (alertId: string) => void;
	} = $props();

	// states for the investigators dropdown
	let assigned = $state<Investigator[]>([]);
	let dropdownOpen = $state(false);

	$effect(() => {
		if (alert) {
			assigned = [];
			dropdownOpen = false;

			// fetch investigators for the alert
			fetch(`/api/investigators/${alert.alert_id}/investigators`)
				.then((res) => {
					if (!res.ok) throw new Error('Failed to load');
					return res.json();
				})
				.then((data) => {
					assigned = data.map((item: any) => (item.investigator ? item.investigator : item));
				})
				.catch((err) => {
					logger.error('Error loading assigned investigators:', err);
					assigned = [];
				});
		} else {
			assigned = [];
			dropdownOpen = false;
		}
	});

	function addInvestigator(investigator: Investigator) {
		if (investigator && !assigned.some((i) => i.investigator_id === investigator.investigator_id)) {
			assigned.push(investigator);
			dropdownOpen = false;
		}
	}

	function removeInvestigator(investigator: Investigator) {
		assigned = assigned.filter((i) => i.investigator_id !== investigator.investigator_id);
	}

	// available investigators
	let availablePool = $derived(
		investigators.filter(
			(investigator) => !assigned.some((a) => a.investigator_id === investigator.investigator_id)
		)
	);

	let isSaving = $state(false);

	async function handleAssignSubmit() {
		if (!alert) return;
		isSaving = true;

		logger.info(assigned);
		try {
			const response = await fetch(`/api/alerts/${alert.alert_id}/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					investigatorIds: assigned.map((i) => i.investigator_id)
				})
			});

			if (!response.ok) throw new Error('Failed to save');

			// reaload to get fresh data
			await invalidateAll();

			open = false;
		} catch (err) {
			logger.error('Failed to assign investigators: ' + err);
		} finally {
			isSaving = false;
		}
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

		<Drawer.Content
			class="fixed right-0 bottom-0 left-0 z-50 flex h-[65vh] max-h-[92vh] flex-col rounded-t-[20px] border-t border-zinc-800 bg-zinc-900 p-6 text-zinc-200 outline-none"
		>
			<div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700" />

			{#if alert}
				<div class="mx-auto w-full max-w-md space-y-6">
					<div>
						<Drawer.Title class="flex items-center gap-2 text-lg font-semibold text-white">
							<span>Alert Actions</span>
							<span class="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
								#{alert.alert_id}
							</span>
						</Drawer.Title>
						<Drawer.Description class="mt-1 text-xs text-zinc-400">
							Camera ID: {alert.camera_id}
						</Drawer.Description>
					</div>

					{#if alert.location?.x && alert.location?.y && alert.status !== 'closed'}
						<button
							type="button"
							onclick={() => onLocate?.(alert.alert_id)}
							class="hover:bg-zinc-850 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							Locate on map
						</button>
					{/if}

					<!-- status management -->
					<form
						method="POST"
						action="?/updateStatus"
						use:enhance={({ submitter }) => {
							const targetButton = submitter as HTMLButtonElement | null;
							const submittedStatus = targetButton?.value || '';
							return async ({ result, update }) => {
								if (result.type === 'success') {
									if (alert && submittedStatus) onstatusupdate(alert.alert_id, submittedStatus);

									await invalidateAll();
									open = false;
								}
								await update({ reset: false });
							};
						}}
					>
						<input type="hidden" name="alertId" value={alert.alert_id} />
						{#if alert.status === 'open' || alert.status === 'active'}
							<button
								type="submit"
								name="status"
								value="closed"
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-zinc-800"
							>
								<span class="h-2 w-2 rounded-full bg-red-500"></span> Close Alert
							</button>
						{:else}
							<button
								type="submit"
								name="status"
								value="open"
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-zinc-800"
							>
								<span class="h-2 w-2 rounded-full bg-emerald-500"></span> Set Open
							</button>
						{/if}
					</form>

					<!-- investigator operations box -->
					<div class="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
						<span class="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
							Investigators Assigned
						</span>

						{#if assigned.length === 0}
							<!-- empty state -->
							<div class="flex flex-col items-center justify-center py-6 text-center">
								<p class="mb-3 text-xs text-zinc-500">No investigators assigned to this alert.</p>
								<div class="relative w-full">
									<button
										type="button"
										data-vaul-no-drag
										onclick={() => (dropdownOpen = !dropdownOpen)}
										class="mx-auto flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
									>
										+ Assign First Investigator
									</button>
								</div>
							</div>
						{:else}
							<!-- populated state -->
							<div class="flex max-h-[80px] flex-wrap gap-1.5 overflow-y-auto pr-1">
								{#each assigned as investigator}
									<span
										class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300"
									>
										{investigator.full_name}
										<button
											type="button"
											onclick={() => removeInvestigator(investigator)}
											class="font-bold text-zinc-500 transition-colors hover:text-red-400"
										>
											×
										</button>
									</span>
								{/each}
							</div>

							<!-- select button for populated view -->
							<div class="relative border-t border-zinc-900 pt-2">
								<button
									type="button"
									data-vaul-no-drag
									onclick={() => (dropdownOpen = !dropdownOpen)}
									class="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800"
								>
									<span>+ Add another investigator...</span>
									<span class="text-[10px] text-zinc-600">▼</span>
								</button>
							</div>
						{/if}

						<!-- dropdown menu -->
						{#if dropdownOpen}
							<div
								data-vaul-no-drag
								class="absolute z-50 mt-1 mr-3 max-h-[160px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl"
							>
								{#if availablePool.length === 0}
									<div class="px-3 py-2 text-center text-xs text-zinc-600">
										All investigators assigned
									</div>
								{:else}
									{#each availablePool as investigator}
										<button
											type="button"
											onclick={() => addInvestigator(investigator)}
											class="w-full rounded-lg px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
										>
											{investigator.full_name}
										</button>
									{/each}
								{/if}
							</div>
						{/if}
					</div>

					<!-- actions -->
					<div class="flex gap-3 pt-2">
						<button
							type="button"
							onclick={() => (open = false)}
							class="h-[48px] flex-1 rounded-xl bg-zinc-800 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						>
							Cancel
						</button>
						<button
							type="button"
							onclick={handleAssignSubmit}
							class="h-[48px] flex-1 rounded-xl bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-700"
						>
							Save Assignments
						</button>
					</div>
				</div>
			{/if}
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
