<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	let { form, data } = $props();

	// Configure marked for full markdown support
	marked.setOptions({
		gfm: true, // GitHub Flavored Markdown
		breaks: true, // Convert line breaks to <br>
		headerIds: true, // Add IDs to headers
		mangle: false, // Don't mangle email addresses
		pedantic: false, // Don't be pedantic
		silent: false, // Show errors
	});

	const DRAFT_KEY = 'editorial_draft';
	const AUTO_SAVE_DELAY = 3000; // 3 detik untuk mengurangi request ke server

	const categories = ['Olahraga', 'Budaya', 'Teknologi', 'Kesehatan', 'Bencana', 'Lainnya'];

	let draftId = $state<string | null>(data?.draftId || null);
	let judul = $state('');
	let kategori = $state('');
	let tanggal = $state(new Date().toISOString().split('T')[0]);
	let gambar = $state('https://example.com/image.png');
	let gambarFile = $state<File | null>(null);
	let gambarPreview = $state<string | null>(null);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadedImageUrl = $state<string | null>(null);
	let excerpt = $state('');
	let konten = $state('');
	let useUrl = $state(true);
	let markdownView = $state<'edit' | 'preview' | 'split'>('split');
	let isDraftSaved = $state(false);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	// Real-time markdown preview dengan debounce
	let markdownPreview = $derived.by(() => {
		if (!konten) return '';
		try {
			return marked.parse(konten);
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return '<p class="text-red-500">Error parsing markdown</p>';
		}
	});

	// Load draft saat mount
	onMount(() => {
		if (data?.article) {
			// Load dari database jika ada draft yang di-edit
			judul = data.article.title || '';
			kategori = data.article.category || '';
			tanggal = data.article.publishedAt
				? new Date(data.article.publishedAt).toISOString().split('T')[0]
				: new Date().toISOString().split('T')[0];
			gambar = data.article.featuredImage || 'https://example.com/image.png';
			excerpt = data.article.excerpt || '';
			konten = data.article.content || '';
			draftId = data.article.id;
		} else {
			// Load dari localStorage
			loadDraft();
		}
		// Auto-save setiap beberapa detik
		return () => {
			if (autoSaveTimer) {
				clearTimeout(autoSaveTimer);
			}
			saveDraftToServer();
		};
	});

	// Auto-save draft dengan debounce
	function scheduleAutoSave() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer);
		}
		autoSaveTimer = setTimeout(() => {
			saveDraftToServer();
		}, AUTO_SAVE_DELAY);
	}

	async function saveDraftToServer() {
		// Hanya save jika ada judul atau konten
		if (!judul && !konten) return;

		try {
			const formData = new FormData();
			if (draftId) formData.append('draftId', draftId);
			formData.append('judul', judul);
			formData.append('kategori', kategori || 'Lainnya');
			formData.append('tanggal', tanggal);
			formData.append('gambar', gambar);
			formData.append('excerpt', excerpt);
			formData.append('konten', konten);

			const response = await fetch('?/saveDraft', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				if (result.type === 'success' && result.data?.draftId) {
					draftId = result.data.draftId;
					isDraftSaved = true;
					setTimeout(() => {
						isDraftSaved = false;
					}, 2000);
				}
			}
		} catch (error) {
			console.error('Error saving draft to server:', error);
		}
	}

	function saveDraft() {
		// Save ke localStorage sebagai backup
		try {
			const draft = {
				judul,
				kategori,
				tanggal,
				gambar,
				excerpt,
				konten,
				useUrl,
				draftId,
				lastSaved: new Date().toISOString()
			};
			localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		} catch (error) {
			console.error('Error saving draft to localStorage:', error);
		}
		// Also save to server
		saveDraftToServer();
	}

	function loadDraft() {
		try {
			const draftStr = localStorage.getItem(DRAFT_KEY);
			if (draftStr) {
				const draft = JSON.parse(draftStr);
				judul = draft.judul || '';
				kategori = draft.kategori || '';
				tanggal = draft.tanggal || new Date().toISOString().split('T')[0];
				gambar = draft.gambar || 'https://example.com/image.png';
				excerpt = draft.excerpt || '';
				konten = draft.konten || '';
				useUrl = draft.useUrl !== undefined ? draft.useUrl : true;
				draftId = draft.draftId || null;
			}
		} catch (error) {
			console.error('Error loading draft:', error);
		}
	}

	function clearDraft() {
		localStorage.removeItem(DRAFT_KEY);
		judul = '';
		kategori = '';
		tanggal = new Date().toISOString().split('T')[0];
		gambar = 'https://example.com/image.png';
		excerpt = '';
		konten = '';
		draftId = null;
		isDraftSaved = false;
	}

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
			uploadedImageUrl = imageUrls.medium || imageUrls.large || imageUrls.original;
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
		uploadedImageUrl = null;
		uploadError = null;
	}

	function handlePreview() {
		// Save draft sebelum preview
		saveDraft();
		
		// Encode data untuk URL
		const params = new URLSearchParams({
			judul: judul || '',
			kategori: kategori || '',
			tanggal: tanggal || '',
			gambar: gambar || '',
			excerpt: excerpt || '',
			konten: konten || ''
		});

		// Buka preview di tab baru
		window.open(`/editorial/preview?${params.toString()}`, '_blank');
	}

	// Watch untuk auto-save ke server
	$effect(() => {
		if (judul || konten) {
			scheduleAutoSave();
		}
	});

	function handlePublishSuccess() {
		// Clear draft setelah publish berhasil
		clearDraft();
		draftId = null;
	}
</script>

<svelte:head>
	<title>Buat Artikel - Editorial Dashboard</title>
</svelte:head>

<main class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white shadow-sm">
		<div class="container mx-auto flex items-center justify-between px-4 py-4 lg:px-16">
			<a
				href="/editorial"
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
				<span>Kembali</span>
			</a>
			<div class="flex items-center gap-4">
				<h1 class="text-xl font-semibold text-gray-900">Editorial Dashboard</h1>
				{#if isDraftSaved}
					<span class="flex items-center gap-1 text-sm text-green-600">
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
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Draft tersimpan
					</span>
				{/if}
			</div>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={saveDraft}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
				>
					Simpan Draft
				</button>
				<button
					onclick={handlePreview}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
				>
					Preview
				</button>
				<form method="POST" action="?/publish" use:enhance={() => {
					return async ({ update }) => {
						// Clear draft setelah publish
						clearDraft();
						await update();
					};
				}}>
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
						Publish
					</button>
				</form>
			</div>
		</div>
	</div>

	<!-- Main Content -->
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
					onchange={scheduleAutoSave}
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
					onchange={scheduleAutoSave}
					class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
				/>
			</div>

			<!-- Gambar -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Gambar</h2>
				<p class="mb-4 text-sm text-gray-600">
					Gambar yang akan ditampilkan di bagian atas berita (Featured Image)
				</p>

				<!-- Toggle antara URL dan Upload -->
				<div class="mb-4 flex gap-4">
					<button
						type="button"
						onclick={() => (useUrl = true)}
						class="rounded-md px-4 py-2 text-sm font-medium transition {useUrl
							? 'bg-shark-950 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						Gunakan URL
					</button>
					<button
						type="button"
						onclick={() => (useUrl = false)}
						class="rounded-md px-4 py-2 text-sm font-medium transition {!useUrl
							? 'bg-shark-950 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						Upload Gambar
					</button>
				</div>

				{#if useUrl}
					<input
						type="url"
						bind:value={gambar}
						oninput={scheduleAutoSave}
						placeholder="https://example.com/image.png"
						class="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-shark-500 focus:outline-none focus:ring-shark-500"
					/>
					{#if gambar && gambar !== 'https://example.com/image.png'}
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
					<div class="space-y-4">
						<label
							for="gambar-upload"
							class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition hover:border-shark-500 hover:bg-gray-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mb-2 h-10 w-10 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
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
							<div class="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8">
								<div class="text-center">
									<svg
										class="mx-auto h-8 w-8 animate-spin text-shark-600"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<p class="mt-2 text-sm text-gray-600">Mengupload dan mengoptimasi gambar...</p>
								</div>
							</div>
						{:else if gambarPreview}
							<div class="relative">
								<img
									src={gambarPreview}
									alt="Preview gambar"
									class="max-h-64 w-full rounded-md object-cover"
									loading="lazy"
								/>
								{#if uploadedImageUrl}
									<div class="absolute left-2 top-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
										✓ Dioptimasi
									</div>
								{/if}
								<button
									type="button"
									onclick={() => {
										gambarFile = null;
										gambarPreview = null;
										uploadedImageUrl = null;
										uploadError = null;
									}}
									class="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white transition hover:bg-red-600"
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
						{#if uploadError}
							<div class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
								{uploadError}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Excerpt -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-2 text-lg font-semibold">Excerpt</h2>
				<p class="mb-4 text-sm text-gray-600">Summary Berita Yang Akan Ditampilkan Di Preview Berita</p>
				<textarea
					bind:value={excerpt}
					oninput={scheduleAutoSave}
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
							class="rounded-md px-3 py-1.5 text-sm font-medium transition {markdownView === 'edit'
								? 'bg-shark-950 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							Edit
						</button>
						<button
							type="button"
							onclick={() => (markdownView = 'preview')}
							class="rounded-md px-3 py-1.5 text-sm font-medium transition {markdownView === 'preview'
								? 'bg-shark-950 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							Preview
						</button>
						<button
							type="button"
							onclick={() => (markdownView = 'split')}
							class="rounded-md px-3 py-1.5 text-sm font-medium transition {markdownView === 'split'
								? 'bg-shark-950 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							Split
						</button>
					</div>
				</div>

				{#if markdownView === 'edit' || markdownView === 'split'}
					<div class="mb-4 rounded-md border border-gray-300 bg-gray-50 p-2 text-xs text-gray-600">
						<strong>Tip:</strong> Gunakan Markdown untuk format teks. Contoh: **tebal**, *miring*, # Heading, - list
					</div>
				{/if}

				<div class="grid gap-4 {markdownView === 'split' ? 'grid-cols-2' : 'grid-cols-1'}">
					{#if markdownView === 'edit' || markdownView === 'split'}
						<div>
							<textarea
								bind:value={konten}
								oninput={scheduleAutoSave}
								placeholder="Isi Berita... (Markdown supported)"
								rows="15"
								class="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							></textarea>
						</div>
					{/if}

					{#if markdownView === 'preview' || markdownView === 'split'}
						<div class="markdown-preview min-h-[400px] rounded-md border border-gray-300 bg-white p-4">
							{#if konten}
								<div class="prose prose-sm max-w-none">
									{@html markdownPreview}
								</div>
							{:else}
								<p class="text-gray-400">Preview akan muncul di sini...</p>
							{/if}
						</div>
					{/if}
				</div>
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
		text-decoration: none;
	}

	.markdown-preview :global(a:hover) {
		text-decoration: underline;
	}

	.markdown-preview :global(img) {
		@apply max-w-full h-auto rounded-md my-4;
	}
</style>

