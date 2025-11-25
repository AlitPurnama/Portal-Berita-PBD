<script>
	import Category from '../Category/Category.svelte';
	export let title = '...';
	export let summary = '... summary';
</script>

<div class="hero">
	<div class="news-info">
		<Category Text="Breaking News"></Category>
		<div class="mt-2 flex flex-col gap-2">
			<span class="title-berita">{title}</span>
			<span>{summary}</span>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.title-berita {
		@apply text-xl;
	}
	.news-info {
		@apply absolute bottom-6 left-10;
	}
	.hero {
		@apply relative h-96 w-full rounded-xl bg-gray-300;
	}
</style>
