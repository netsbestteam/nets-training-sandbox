<script lang="ts">
	import { Drawer } from 'vaul-svelte';
	import { enhance } from '$app/forms';
	import type { Alert } from '$lib/components/TableColumns/AlertsColumns';

	let {
		open = $bindable(false),
		alert = $bindable(),
		onstatusupdate
	}: {
		open: boolean;
		alert: Alert | null;
		onstatusupdate: (alertId: string, nextStatus: string) => void;
	} = $props();
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

		<Drawer.Content
			class="fixed right-0 bottom-0 left-0 z-50 flex h-[30vh] max-h-[92vh] flex-col rounded-t-[20px] border-t border-zinc-800 bg-zinc-900 p-6 text-zinc-200 outline-none"
		>
			<div class="mx-auto mb-6 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-700" />

			{#if alert}
				<form
					method="POST"
					action="?/updateStatus"
					use:enhance={({ submitter }) => {
						// Natively grab the value of the button that triggered the submit
						const targetButton = submitter as HTMLButtonElement | null;
						const submittedStatus = targetButton?.value || '';

						return async ({ result, update }) => {
							if (result.type === 'success') {
								if (alert && submittedStatus) {
									onstatusupdate(alert.alert_id, submittedStatus);
								}
								open = false;
							}
							await update({ reset: false });
						};
					}}
					class="mx-auto w-full max-w-md"
				>
					<!-- Pure declarative payload inputs -->
					<input type="hidden" name="alertId" value={alert.alert_id} />

					<Drawer.Title class="flex items-center gap-2 text-lg font-semibold text-white">
						<span>Alert Actions</span>
						<span class="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
							#{alert.alert_id}
						</span>
					</Drawer.Title>

					<Drawer.Description class="mt-1 mb-6 text-xs text-zinc-400">
						Camera ID: {alert.camera_id}
					</Drawer.Description>

					<div class="space-y-4">
						<div class="w-full">
							{#if alert.status === 'open' || alert.status === 'active'}
								<button
									type="submit"
									name="status"
									value="closed"
									class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-zinc-800"
								>
									<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
									Close Alert
								</button>
							{:else}
								<button
									type="submit"
									name="status"
									value="open"
									class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-zinc-800"
								>
									<span class="h-2 w-2 rounded-full bg-red-600"></span>
									Set Open
								</button>
							{/if}
						</div>

						<button
							type="button"
							onclick={() => (open = false)}
							class="h-[50px] w-full rounded-2xl bg-zinc-800 font-semibold text-white transition-colors hover:bg-zinc-700"
						>
							Cancel
						</button>
					</div>
				</form>
			{/if}
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>
