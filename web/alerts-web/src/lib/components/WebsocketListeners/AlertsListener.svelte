<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { logger } from '#shared/backend/logger/index';

	interface Props {
		store: { add: (data: any) => void };
	}

	let { store }: Props = $props();
	let eventSource: EventSource | null = null;

	onMount(() => {
		eventSource = new EventSource('/ws');

		eventSource.onmessage = (event) => {
			try {
				const parsed = JSON.parse(event.data);
				store.add(parsed);
			} catch (err) {
				logger.error('Failed to process incoming stream payload:' + err);
			}
		};
	});

	onDestroy(() => {
		eventSource?.close();
	});
</script>
