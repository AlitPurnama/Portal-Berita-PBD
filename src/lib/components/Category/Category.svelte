<script lang="ts">
	export let Text: string;
	export let Size: 'Big' | 'Medium' | 'Small' = 'Big';
</script>

<div
	class="w-fit rounded bg-slate-900 px-4 py-1 text-center text-white"
	class:medium={Size == 'Medium'}
	class:small={Size == 'Small'}
>
	<span>{Text}</span>
</div>

<style lang="postcss">
	@reference "tailwindcss"
	.medium {
		@apply scale-75 transform;
	}
</style>
