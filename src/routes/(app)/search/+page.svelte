<script lang="ts">
	import NewsBig from '$lib/components/News/NewsBig.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let query = $state(data?.query || '');
	let articles = $derived(data?.articles || []);
	let totalResults = $derived(data?.totalResults || 0);

	function handleSearch(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const searchQuery = formData.get('q')?.toString().trim() || '';

		if (searchQuery.length >= 2) {
			goto(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	}
</script>

<svelte:head>
	<title>{query ? `Hasil Pencarian: ${query} - Portal Berita` : 'Cari Berita - Portal Berita'}</title>
</svelte:head>

<main class="container mx-auto my-10 px-4 lg:px-16">
	<div class="mx-auto max-w-6xl">
		<!-- Search Header -->
		<div class="mb-8">
			<h1 class="mb-4 text-3xl font-bold">Cari Berita</h1>
			
			<!-- Search Form -->
			<form onsubmit={handleSearch} class="mb-6">
				<div class="flex gap-2">
					<input
						type="search"
						name="q"
						bind:value={query}
						placeholder="Cari berita, artikel, atau topik..."
						class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
						minlength="2"
						required
					/>
					<button
						type="submit"
						class="rounded-lg bg-shark-950 px-6 py-2 text-white transition hover:bg-shark-900"
					>
						Cari
					</button>
				</div>
			</form>

			<!-- Search Results Info -->
			{#if query}
				<div class="mb-4">
					{#if totalResults > 0}
						<p class="text-gray-600">
							Ditemukan <span class="font-semibold">{totalResults}</span> artikel untuk "
							<span class="font-semibold">{query}</span>"
						</p>
					{:else}
						<p class="text-gray-600">
							Tidak ada hasil untuk "<span class="font-semibold">{query}</span>"
						</p>
					{/if}
				</div>
			{:else}
				<p class="text-gray-600">Masukkan kata kunci untuk mencari artikel</p>
			{/if}
		</div>

		<!-- Search Results -->
		{#if query && query.length >= 2}
			{#if articles.length > 0}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
			{:else if query.length >= 2}
				<div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-16 w-16 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Tidak ada hasil ditemukan</h3>
					<p class="mt-2 text-gray-600">
						Coba gunakan kata kunci yang berbeda atau periksa ejaan Anda
					</p>
					<a
						href="/"
						class="mt-6 inline-block rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
					>
						Kembali ke Beranda
					</a>
				</div>
			{/if}
		{:else if !query}
			<div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<h3 class="mt-4 text-lg font-semibold text-gray-900">Cari Artikel</h3>
				<p class="mt-2 text-gray-600">Masukkan kata kunci di atas untuk mencari artikel</p>
			</div>
		{/if}
	</div>
</main>

