<script lang="ts">
	import Hero from '$lib/components/Hero/Hero.svelte';
	import NewsBig from '$lib/components/News/NewsBig.svelte';
	import Category from '$lib/components/Category/Category.svelte';

	let { data } = $props();

	let breakingNews = $derived(data?.breakingNews);
	let latestNews = $derived(data?.latestNews || []);
	let articlesByCategory = $derived(data?.articlesByCategory || {});
</script>

<main class="container mx-auto mt-10 w-screen px-4 lg:px-16">
	<!-- Hero Section - Breaking News -->
	{#if breakingNews}
		<section id="hero">
			<a href="/details/{breakingNews.slug}" class="block cursor-pointer">
				<Hero
					title={breakingNews.title}
					summary={breakingNews.excerpt || 'Baca selengkapnya...'}
					image={breakingNews.featuredImage || 'https://bigtex.com/wp-content/uploads/2018/05/placeholder-1920x1080.png'}
				/>
			</a>
		</section>
	{:else}
		<section id="hero">
			<Hero
				title="Selamat Datang di Portal Berita"
				summary="Portal berita terpercaya untuk informasi terkini"
				image="https://bigtex.com/wp-content/uploads/2018/05/placeholder-1920x1080.png"
			/>
		</section>
	{/if}

	<!-- Latest News Section -->
	{#if latestNews.length > 0}
		<section id="latest-news" class="mt-12">
			<h2 class="text-2xl font-bold mb-4">Berita Terkini</h2>
			<div class="latest-placeholder">
				{#each latestNews as article}
					<NewsBig
						title={article.title}
						description={article.excerpt || ''}
						image={article.featuredImage || ''}
						date={article.publishedAt || article.createdAt}
						author={article.author?.username || ''}
						views={article.views || 0}
						href="/details/{article.slug}"
					/>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Category Sections -->
	{#each Object.entries(articlesByCategory) as [category, articles]}
		{#if articles.length > 0}
			<section id={category} class="mt-12">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-2xl font-bold">{category}</h2>
					<a
						href="/category/{category.toLowerCase()}"
						class="text-shark-600 hover:text-shark-800 text-sm font-medium hover:underline"
					>
						Lihat Semua →
					</a>
				</div>
				<div class="latest-placeholder">
					{#each articles as article}
						<NewsBig
							title={article.title}
							description={article.excerpt || ''}
							image={article.featuredImage || ''}
							date={article.publishedAt || article.createdAt}
							author={article.author?.username || ''}
							views={article.views || 0}
							href="/details/{article.slug}"
						/>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</main>

<style lang="postcss">
	@reference "tailwindcss";
	section {
		@apply my-12;
	}
	.latest-placeholder {
		@apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6;
		@apply mt-4;
	}
</style>
