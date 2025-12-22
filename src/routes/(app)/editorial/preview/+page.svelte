<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import Category from '$lib/components/Category/Category.svelte';
	import NewsProfileCard from '$lib/components/News/NewsProfileCard.svelte';

	let { data } = $props();

	// Configure marked for full markdown support
	marked.setOptions({
		gfm: true, // GitHub Flavored Markdown
		breaks: true, // Convert line breaks to <br>
		headerIds: true, // Add IDs to headers
		mangle: false, // Don't mangle email addresses
		pedantic: false, // Don't be pedantic
		silent: false, // Show errors
	});

	let judul = $derived(data?.judul || 'Judul Artikel');
	let kategori = $derived(data?.kategori || 'Kategori');
	let tanggal = $derived(data?.tanggal || new Date().toLocaleDateString('id-ID'));
	let gambar = $derived(data?.gambar || 'https://example.com/image.png');
	let excerpt = $derived(data?.excerpt || '');
	let konten = $derived(data?.konten || '');

	let kontenHtml = $derived.by(() => {
		if (!konten) return '';
		try {
			return marked.parse(konten);
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return '<p class="text-red-500">Error parsing markdown</p>';
		}
	});

	function handleBack() {
		goto('/editorial/create');
	}
</script>

<svelte:head>
	<title>Preview: {judul} - Portal Berita</title>
</svelte:head>

<main>
	<div class="container mx-auto my-10">
		<!-- Back Button -->
		<div class="mb-6">
			<button
				onclick={handleBack}
				class="flex items-center gap-2 text-gray-600 transition hover:text-gray-900"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				<span>Kembali ke Editor</span>
			</button>
		</div>

		<div class="info-berita">
			<div class="-translate-x-3.5 transform">
				<Category Text={kategori} Size="Medium" />
			</div>
			<div class="mt-4">
				<h1 class="text-xl font-semibold">{judul}</h1>
				{#if excerpt}
					<p class="mt-2 text-gray-600">{excerpt}</p>
				{/if}
			</div>
			<div class="mt-2 mb-2 flex gap-10 font-light">
				<p>Tanggal: {tanggal}</p>
			</div>
			<NewsProfileCard />
			<div
				style="background-image: url('{gambar}');"
				class="news-image"
			></div>
			<div class="news-text">
				{@html kontenHtml}
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	@reference "tailwindcss";

	.news-image {
		@apply mt-5 h-128 w-full rounded bg-cover bg-center bg-no-repeat;
	}

	.news-text {
		@apply mt-4 text-justify;
	}

	.news-text :global(h1) {
		@apply text-2xl font-bold mb-4 mt-6;
	}

	.news-text :global(h2) {
		@apply text-xl font-bold mb-3 mt-5;
	}

	.news-text :global(h3) {
		@apply text-lg font-semibold mb-2 mt-4;
	}

	.news-text :global(p) {
		@apply mb-4 text-gray-700 leading-relaxed;
	}

	.news-text :global(ul),
	.news-text :global(ol) {
		@apply mb-4 ml-6;
	}

	.news-text :global(li) {
		@apply mb-2 text-gray-700;
	}

	.news-text :global(strong) {
		@apply font-bold text-gray-900;
	}

	.news-text :global(em) {
		@apply italic;
	}

	.news-text :global(code) {
		@apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600;
	}

	.news-text :global(pre) {
		@apply bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto;
	}

	.news-text :global(pre code) {
		@apply bg-transparent p-0 text-gray-800;
	}

	.news-text :global(blockquote) {
		@apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
	}

	.news-text :global(a) {
		color: var(--color-shark-600);
		text-decoration: none;
	}

	.news-text :global(a:hover) {
		text-decoration: underline;
	}

	.news-text :global(img) {
		@apply max-w-full h-auto rounded-md my-4;
	}
</style>

