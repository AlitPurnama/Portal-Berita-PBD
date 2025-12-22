<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { ArrowLeft } from '@lucide/svelte';

	let { data, form } = $props();

	// Configure marked for full markdown support
	marked.setOptions({
		gfm: true, // GitHub Flavored Markdown
		breaks: true, // Convert line breaks to <br>
		headerIds: true, // Add IDs to headers
		mangle: false, // Don't mangle email addresses
		pedantic: false, // Don't be pedantic
		silent: false, // Show errors
	});

	const categories = ['Olahraga', 'Budaya', 'Teknologi', 'Kesehatan', 'Bencana', 'Lainnya'];

	let article = $derived(data?.article);

	let judul = $state(article?.title || '');
	let kategori = $state(article?.category || '');
	let tanggal = $state(
		article?.publishedAt
			? new Date(article.publishedAt).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0]
	);
	let gambar = $state(article?.featuredImage || '');
	let gambarFile = $state<File | null>(null);
	let gambarPreview = $state<string | null>(null);
	let excerpt = $state(article?.excerpt || '');
	let konten = $state(article?.content || '');
	let useUrl = $state(true);
	let markdownView = $state<'edit' | 'preview' | 'split'>('split');
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);

	// Initialize form dengan data artikel
	onMount(() => {
		if (article) {
			judul = article.title || '';
			kategori = article.category || '';
			tanggal = article.publishedAt
				? new Date(article.publishedAt).toISOString().split('T')[0]
				: new Date().toISOString().split('T')[0];
			gambar = article.featuredImage || '';
			excerpt = article.excerpt || '';
			konten = article.content || '';
			useUrl = true;
		}
	});

	// Real-time markdown preview
	let markdownPreview = $derived.by(() => {
		if (!konten) return '';
		try {
			return marked.parse(konten);
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return '<p class="text-red-500">Error parsing markdown</p>';
		}
	});

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		gambarFile = file;
		useUrl = false;
		uploadError = null;
		isUploading = true;

		// Create preview immediately
		const reader = new FileReader();
		reader.onload = (e) => {
			gambarPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Upload to server
		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/upload-image', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Gagal mengupload gambar');
			}

			const result = await response.json();
			
			// Use medium or large size for featured image
			// API returns both 'urls' and 'images' with same structure
			const imageUrls = result.images || result.urls || result;
			const uploadedImageUrl = imageUrls.medium || imageUrls.large || imageUrls.original;
			gambar = uploadedImageUrl || '';
			
			// Update preview with optimized image
			gambarPreview = uploadedImageUrl || null;
		} catch (error: any) {
			console.error('Upload error:', error);
			uploadError = error.message || 'Gagal mengupload gambar';
			// Keep preview but show error
		} finally {
			isUploading = false;
		}
	}

	function switchToUrl() {
		useUrl = true;
		gambarFile = null;
		gambarPreview = null;
	}

	function switchToUpload() {
		useUrl = false;
		gambar = '';
	}

	function handlePreview() {
		const params = new URLSearchParams({
			judul: judul || '',
			kategori: kategori || '',
			tanggal: tanggal || '',
			gambar: gambar || '',
			excerpt: excerpt || '',
			konten: konten || ''
		});
		window.open(`/editorial/preview?${params.toString()}`, '_blank');
	}

	function handleUpdateSuccess(result: any) {
		if (result?.type === 'success' && result?.data?.slug) {
			goto(`/details/${result.data.slug}`);
		}
	}
</script>

<svelte:head>
	<title>Edit Artikel - Editorial Dashboard</title>
</svelte:head>

<main class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto flex items-center justify-between px-4 py-4 lg:px-16">
			<a
				href="/editorial"
				class="flex items-center gap-2 text-gray-600 transition hover:text-gray-900"
			>
				<ArrowLeft class="h-5 w-5" />
				<span>Kembali</span>
			</a>
			<h1 class="text-lg font-semibold text-gray-800">Edit Artikel</h1>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={handlePreview}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
				>
					Preview
				</button>
				<form
					method="POST"
					action="?/update"
					use:enhance={({ result }) => {
						return async ({ update }) => {
							await update();
							if (result.type === 'success' && result.data?.slug) {
								goto(`/details/${result.data.slug}`);
							}
						};
					}}
				>
					<input type="hidden" name="judul" value={judul} />
					<input type="hidden" name="kategori" value={kategori} />
					<input type="hidden" name="tanggal" value={tanggal} />
					<input type="hidden" name="gambar" value={gambar} />
					<input type="hidden" name="excerpt" value={excerpt} />
					<input type="hidden" name="konten" value={konten} />
					<button
						type="submit"
						class="rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
					>
						Update
					</button>
				</form>
			</div>
		</div>
		{#if form?.error}
			<div class="container mx-auto mt-4 px-4 lg:px-16">
				<div class="mx-auto max-w-4xl rounded-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-sm">
					{form.error}
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Content - Same as create page -->
	<div class="container mx-auto px-4 py-8 lg:px-16">
		<div class="mx-auto max-w-4xl space-y-6">
			<!-- Judul Artikel -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Judul Artikel</h2>
				<p class="mb-4 text-sm text-gray-600">Tulis Judul Artikel Yang Menarik...</p>
				<input
					type="text"
					bind:value={judul}
					placeholder="Judul Artikel..."
					class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
				/>
			</div>

			<!-- Kategori -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Kategori</h2>
				<p class="mb-4 text-sm text-gray-600">Pilih Kategori Berita</p>
				<select
					bind:value={kategori}
					class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
				>
					<option value="">-- Pilih Kategori --</option>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<!-- Tanggal -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Tanggal</h2>
				<p class="mb-4 text-sm text-gray-600">Tanggal berita di buat</p>
				<input
					type="date"
					bind:value={tanggal}
					class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
				/>
			</div>

			<!-- Gambar -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Gambar</h2>
				<p class="mb-4 text-sm text-gray-600">
					Gambar yang akan ditampilkan di bagian atas berita (Featured Image)
				</p>
				<div class="mb-4 flex space-x-4">
					<button
						type="button"
						onclick={switchToUrl}
						class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition {useUrl ? 'bg-shark-950 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
					>
						Gunakan URL
					</button>
					<button
						type="button"
						onclick={switchToUpload}
						class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition {!useUrl ? 'bg-shark-950 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
					>
						Upload Gambar
					</button>
				</div>

				{#if useUrl}
					<input
						type="url"
						bind:value={gambar}
						placeholder="https://example.com/image.png"
						class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
					/>
					{#if gambar && gambar.trim() !== ''}
						<div class="mt-4">
							<img
								src={gambar}
								alt="Preview gambar"
								class="max-h-64 w-full rounded-md object-cover"
								onerror={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
						</div>
					{/if}
				{:else}
					<label
						for="gambar-upload"
						class="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
					>
						<p class="mb-2 text-sm text-gray-500">
							<span class="font-semibold">Klik untuk upload</span> atau drag and drop
						</p>
						<p class="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
						<input
							id="gambar-upload"
							type="file"
							accept="image/*"
							onchange={handleFileUpload}
							class="hidden"
						/>
					</label>
					{#if isUploading}
						<div class="mt-4 rounded-md bg-blue-50 p-4 text-center">
							<p class="text-sm text-blue-600">Mengupload dan mengoptimasi gambar...</p>
						</div>
					{:else if uploadError}
						<div class="mt-4 rounded-md bg-red-50 p-4">
							<p class="text-sm text-red-600">{uploadError}</p>
						</div>
					{:else if gambarPreview}
						<div class="relative mt-4">
							<img
								src={gambarPreview}
								alt="Preview gambar"
								class="max-h-64 w-full rounded-md object-cover"
							/>
							<button
								type="button"
								onclick={() => {
									gambarFile = null;
									gambarPreview = null;
									gambar = '';
								}}
								class="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
								aria-label="Hapus gambar"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Excerpt -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Excerpt</h2>
				<p class="mb-4 text-sm text-gray-600">Summary Berita Yang Akan Ditampilkan Di Preview Berita</p>
				<textarea
					bind:value={excerpt}
					placeholder="Excerpt..."
					rows="4"
					class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
				></textarea>
			</div>

			<!-- Konten Artikel -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<h2 class="mb-2 text-lg font-semibold">Konten Artikel</h2>
						<p class="text-sm text-gray-600">Isi Berita (Markdown supported)</p>
					</div>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => (markdownView = 'edit')}
							class="rounded-md px-3 py-1 text-sm font-medium transition {markdownView === 'edit' ? 'bg-shark-950 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
						>
							Edit
						</button>
						<button
							type="button"
							onclick={() => (markdownView = 'preview')}
							class="rounded-md px-3 py-1 text-sm font-medium transition {markdownView === 'preview' ? 'bg-shark-950 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
						>
							Preview
						</button>
						<button
							type="button"
							onclick={() => (markdownView = 'split')}
							class="rounded-md px-3 py-1 text-sm font-medium transition {markdownView === 'split' ? 'bg-shark-950 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
						>
							Split
						</button>
					</div>
				</div>

				<div class="grid gap-4" class:md:grid-cols-2={markdownView === 'split'}>
					{#if markdownView === 'edit' || markdownView === 'split'}
						<textarea
							bind:value={konten}
							placeholder="Tulis konten artikel Anda di sini menggunakan Markdown..."
							rows={markdownView === 'split' ? 20 : 15}
							class="w-full rounded-md border border-gray-300 p-4 font-mono text-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
						></textarea>
					{/if}

					{#if markdownView === 'preview' || markdownView === 'split'}
						<div
							class="markdown-preview rounded-md border border-gray-300 bg-gray-50 p-4"
							class:h-full={markdownView === 'split'}
						>
							{@html markdownPreview}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	@reference "tailwindcss";

	.markdown-preview {
		overflow-y: auto;
		max-height: 600px;
	}

	.markdown-preview :global(h1) {
		@apply text-2xl font-bold mb-4 mt-6;
	}

	.markdown-preview :global(h2) {
		@apply text-xl font-bold mb-3 mt-5;
	}

	.markdown-preview :global(h3) {
		@apply text-lg font-semibold mb-2 mt-4;
	}

	.markdown-preview :global(p) {
		@apply mb-4 text-gray-700 leading-relaxed;
	}

	.markdown-preview :global(ul),
	.markdown-preview :global(ol) {
		@apply mb-4 ml-6;
	}

	.markdown-preview :global(li) {
		@apply mb-2 text-gray-700;
	}

	.markdown-preview :global(strong) {
		@apply font-bold text-gray-900;
	}

	.markdown-preview :global(em) {
		@apply italic;
	}

	.markdown-preview :global(code) {
		@apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600;
	}

	.markdown-preview :global(pre) {
		@apply bg-gray-100 p-4 rounded-md mb-4 overflow-x-auto;
	}

	.markdown-preview :global(pre code) {
		@apply bg-transparent p-0 text-gray-800;
	}

	.markdown-preview :global(blockquote) {
		@apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
	}

	.markdown-preview :global(a) {
		color: var(--color-shark-600);
		@apply hover:underline;
	}

	.markdown-preview :global(img) {
		@apply max-w-full h-auto rounded-md my-4;
	}
</style>

