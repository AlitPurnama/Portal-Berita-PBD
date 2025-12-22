<script lang="ts">
	import { page } from '$app/state';
	import NewsBig from '$lib/components/News/NewsBig.svelte';
	import Category from '$lib/components/Category/Category.svelte';

	let { data } = $props();

	let category = $derived(data?.category);
	let articles = $derived(data?.articles || []);

	function formatDate(date: Date | null | string | undefined): string {
		if (!date) return '';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{category ? `Kategori ${category} - Portal Berita` : 'Kategori - Portal Berita'}</title>
</svelte:head>

<main class="container mx-auto my-10 px-4 lg:px-16">
	<div class="mx-auto max-w-6xl">
		{#if category}
			<div class="mb-8">
				<div class="mb-4">
					<Category Text={category} Size="Large" />
				</div>
				<h1 class="text-3xl font-bold">Kategori: {category}</h1>
				<p class="mt-2 text-gray-600">
					{#if articles.length > 0}
						Ditemukan {articles.length} artikel dalam kategori ini
					{:else}
						Tidak ada artikel dengan kategori {category}
					{/if}
				</p>
			</div>

			{#if articles.length > 0}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each articles as article}
						<a href="/details/{article.slug}" class="block">
							<div class="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
								{#if article.featuredImage}
									<div
										class="h-48 w-full rounded-t-lg bg-cover bg-center"
										style="background-image: url('{article.featuredImage}');"
									></div>
								{:else}
									<div class="h-48 w-full rounded-t-lg bg-gray-200"></div>
								{/if}
								<div class="p-4">
									<h2 class="mb-2 text-lg font-semibold line-clamp-2">{article.title}</h2>
									{#if article.excerpt}
										<p class="mb-3 text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
									{/if}
									<div class="flex items-center justify-between text-xs text-gray-500">
										<span>{formatDate(article.publishedAt || article.createdAt)}</span>
										<span>{article.views || 0} kali dibaca</span>
									</div>
									{#if article.author}
										<div class="mt-2 text-xs text-gray-500">
											Oleh: {article.author.username}
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
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
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Tidak ada artikel</h3>
					<p class="mt-2 text-gray-600">Tidak ada artikel dengan kategori {category}</p>
					<a
						href="/"
						class="mt-6 inline-block rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
					>
						Kembali ke Beranda
					</a>
				</div>
			{/if}
		{:else}
			<div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
				<h3 class="text-lg font-semibold text-gray-900">Kategori tidak ditemukan</h3>
				<p class="mt-2 text-gray-600">Kategori yang Anda cari tidak tersedia.</p>
				<a
					href="/"
					class="mt-6 inline-block rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
				>
					Kembali ke Beranda
				</a>
			</div>
		{/if}
	</div>
</main>
