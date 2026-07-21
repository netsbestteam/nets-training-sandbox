<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

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
				console.error('Failed to process incoming stream payload:', err);
			}
		};
	});

	onDestroy(() => {
		eventSource?.close();
	});
</script>
