<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" />
</svelte:head>

<Toaster position="bottom-right" theme="dark" richColors />

<div
	class="min-h-screen bg-black text-white"
	style="background-image: radial-gradient(circle at top right, rgba(69, 10, 10, 0.7), #000000 90%);"
>
	{@render children()}
</div>
