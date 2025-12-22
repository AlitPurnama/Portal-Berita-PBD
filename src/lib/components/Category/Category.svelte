<script lang="ts">
	export let Text: string;
	export let Size: 'Big' | 'Medium' | 'Small' = 'Big';
	export let Mode: 'Light' | 'Dark' = 'Light';
</script>

<div
	class="m-0 w-fit rounded bg-shark-950 px-4 py-1 text-center text-white"
	class:dark={Mode == 'Dark'}
	class:light={Mode == 'Light'}
	class:medium={Size == 'Medium'}
	class:small={Size == 'Small'}
>
	<p class="font-semibold">{Text}</p>
</div>

<style lang="postcss">
	@reference "tailwindcss"


	.dark {
		@apply bg-shark-950!;
		@apply text-gray-200!;
	}
	.light {
		@apply bg-gray-300;
		@apply text-gray-950;
	}
	.medium {
		@apply scale-80 transform;
	}
	.small {
		@apply scale-[70%] transform;
	}
</style>
