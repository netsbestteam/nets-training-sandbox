<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
	<div
		class="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center shadow-2xl"
	>
		<h1 class="text-2xl font-bold">כניסה למערכת</h1>

		{#if data.error}
			<div class="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
				{data.error}
			</div>
		{/if}

		<a
			rel="external"
			href={data.keycloakLoginUrl}
			class="block w-full rounded-lg bg-red-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-red-700"
		>
			התחבר דרך Keycloak
		</a>
	</div>
</div>
