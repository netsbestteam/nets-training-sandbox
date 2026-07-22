<script lang="ts">
	import { Drawer } from 'vaul-svelte';
	import { enhance } from '$app/forms';
	import type { Alert } from '$lib/components/TableColumns/AlertsColumns';
	import InvestigatorDropdown from './InvestigatorDropdown.svelte'; // [REPLACED] Import here

	let {
		open = $bindable(false),
		alert = $bindable(),
		onstatusupdate
	}: {
		open: boolean;
		alert: Alert | null;
		onstatusupdate: (alertId: string, nextStatus: string) => void;
	} = $props();

	const investigators = ['Or Hildesheim', 'Maxim Klein', 'Alon Eilat', 'Yonathan Tyomkin'];
	let assigned = $state<string[]>([]);

	$effect(() => {
		if (alert) {
			assigned = [];
		}
	});

	function removeInvestigator(name: string) {
		assigned = assigned.filter((i) => i !== name);
	}

	function handleAssignSubmit() {
		console.log(`Saving assignments for alert ${alert?.alert_id}:`, $state.snapshot(assigned));
		open = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

		<Drawer.Content
			class="fixed right-0 bottom-0 left-0 z-50 flex h-[65vh] max-h-[92vh] flex-col rounded-t-[20px] border-t border-zinc-800 bg-zinc-900 p-6 text-zinc-200 outline-none"
		>
			<div class="mx-auto mb-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-700" />

			{#if alert}
				<div class="mx-auto w-full max-w-md space-y-6">
					<div>
						<Drawer.Title class="flex items-center gap-2 text-lg font-semibold text-white">
							<span>Alert Actions</span>
							<span class="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
								#{alert.alert_id.slice(0, 8)}
							</span>
						</Drawer.Title>
						<Drawer.Description class="mt-1 text-xs text-zinc-400">
							Camera ID: {alert.camera_id}
						</Drawer.Description>
					</div>

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

						{#if assigned.length > 0}
							<div class="flex max-h-[80px] flex-wrap gap-1.5 overflow-y-auto pr-1">
								{#each assigned as name}
									<span
										class="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300"
									>
										{name}
										<button
											type="button"
											onclick={() => removeInvestigator(name)}
											class="font-bold text-zinc-500 transition-colors hover:text-red-400"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						{/if}

						<!-- Clean integrated sub-component -->
						<InvestigatorDropdown bind:assigned pool={investigators} />
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
							disabled={assigned.length === 0}
							class="h-[48px] flex-1 rounded-xl bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
						>
							Save Assignments
						</button>
					</div>
				</div>
			{/if}
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
