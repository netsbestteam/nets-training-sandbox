<script lang="ts">
	interface CardStyle {
		active: string;
		label: string;
		count: string;
	}

	interface Props {
		label: string;
		count: number;
		isActive: boolean;
		onclick: () => void;
		style?: CardStyle;
	}

	let {
		label,
		count,
		isActive,
		onclick,
		style = {
			active: 'border-zinc-400 bg-zinc-800/50 shadow-lg ring-1 ring-zinc-400/20',
			label: 'text-zinc-400',
			count: 'text-white'
		}
	}: Props = $props();
</script>

<button
	{onclick}
	class="w-full cursor-pointer rounded-xl border p-4 text-left backdrop-blur-md transition-all duration-200
        {isActive
		? style.active
		: 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40'}"
>
	<p class="text-xs font-medium tracking-wider uppercase {style.label}">
		{label}
	</p>
	<p class="mt-2 text-3xl font-bold {style.count}">
		{count}
	</p>
</button>
