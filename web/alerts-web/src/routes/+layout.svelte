<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="min-h-screen bg-black text-white"
	style="background-image: radial-gradient(circle at top right, rgba(69, 10, 10, 0.7), #000000 90%);"
>
	{@render children()}
</div>
