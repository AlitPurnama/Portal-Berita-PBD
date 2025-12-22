<script>
	import Category from '../Category/Category.svelte';
	export let title = '...';
	export let summary = '... summary';
	export let image = '';
</script>

<div class="hero bg-cover bg-center bg-no-repeat" style="background-image: url('{image}')">
	<div class="news-info">
		<div class="relative -translate-x-3 transform">
			<Category Text="Breaking News" Size="Medium" Mode="Dark" />
		</div>
		<div class="mt-2 flex flex-col items-start gap-2 text-left">
			<span class="title-berita">{title}</span>
			<span class="title-summary">{summary}</span>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.title-berita {
		@apply text-xl font-bold;
	}

	.news-info {
		@apply absolute bottom-6 left-10 z-10 flex flex-col items-start justify-start;
	}

	.hero {
		@apply relative h-96 w-full overflow-hidden rounded-xl bg-gray-300;
	}
</style>
