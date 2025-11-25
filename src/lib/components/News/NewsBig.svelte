<script>
	import Category from '../Category/Category.svelte';
</script>

<div class="news-big">
	<div class="placeholder">NEWS HERE</div>
	<Category Text="Teknologi" Size="Medium"></Category>
</div>

<style lang="postcss">
	@reference "tailwindcss"
    .news-big {
		@apply h-full w-lg bg-amber-300;
	}
</style>
