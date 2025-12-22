<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import ConfirmModal from '$lib/components/Modal/ConfirmModal.svelte';
	import { showSuccess, showError } from '$lib/components/Toast/toastStore';

	let { data, form } = $props();

	let articles = $derived(data?.articles || []);

	let totalArticles = $derived(articles.length);
	let publishedArticles = $derived(articles.filter((a) => a.publishedAt).length);
	let draftArticles = $derived(articles.filter((a) => !a.publishedAt).length);

	let deletingArticleId = $state<string | null>(null);
	let showDeleteModal = $state(false);
	let articleToDelete = $state<{ id: string; title: string } | null>(null);

	// Show toast notifications based on form results
	$effect(() => {
		if (form) {
			// Handle delete result
			const deleteResult = form.delete;
			if (deleteResult) {
				if (typeof deleteResult === 'object') {
					if ('success' in deleteResult && deleteResult.success) {
						showSuccess('Artikel berhasil dihapus');
					} else if ('error' in deleteResult) {
						showError(deleteResult.error as string);
					}
				}
			}
		}
	});

	function formatDate(date: Date | null | string | undefined): string {
		if (!date) return '-';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function editArticle(slug: string) {
		goto(`/editorial/edit/${slug}`);
	}

	function continueDraft(articleId: string) {
		goto(`/editorial/create?draftId=${articleId}`);
	}

	function viewArticle(slug: string) {
		goto(`/details/${slug}`);
	}

	function confirmDelete(articleId: string, title: string) {
		articleToDelete = { id: articleId, title };
		showDeleteModal = true;
	}

	function handleDeleteConfirm() {
		if (articleToDelete) {
			deletingArticleId = articleToDelete.id;
			const form = document.getElementById(`delete-form-${articleToDelete.id}`) as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}
		articleToDelete = null;
	}

	function handleDeleteCancel() {
		articleToDelete = null;
		showDeleteModal = false;
	}
</script>

<svelte:head>
	<title>Editorial - Portal Berita</title>
</svelte:head>

<main class="container mx-auto my-10 px-4 lg:px-16">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Dashboard Editorial</h1>
			<a
				href="/editorial/create"
				class="rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
			>
				+ Buat Artikel Baru
			</a>
		</div>

		<!-- Stats Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="text-sm font-medium text-gray-600">Total Artikel</h3>
				<p class="mt-2 text-3xl font-bold">{totalArticles}</p>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="text-sm font-medium text-gray-600">Diterbitkan</h3>
				<p class="mt-2 text-3xl font-bold text-green-600">{publishedArticles}</p>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="text-sm font-medium text-gray-600">Draft</h3>
				<p class="mt-2 text-3xl font-bold text-yellow-600">{draftArticles}</p>
			</div>
		</div>

		<!-- Articles Table -->
		<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold">Artikel Terbaru</h2>
			</div>
			{#if articles.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Judul
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Kategori
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Kunjungan
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Tanggal
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each articles as article}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<div class="max-w-md">
											<p class="font-medium text-gray-900">{article.title}</p>
											{#if article.excerpt}
												<p class="mt-1 text-sm text-gray-500 line-clamp-1">{article.excerpt}</p>
											{/if}
										</div>
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
											{article.category}
										</span>
									</td>
									<td class="px-6 py-4">
										{#if article.publishedAt}
											<span class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
												Diterbitkan
											</span>
										{:else}
											<span class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
												Draft
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">
										{article.views || 0} kali
									</td>
									<td class="px-6 py-4 text-sm text-gray-500">
										{formatDate(article.publishedAt || article.createdAt)}
									</td>
									<td class="px-6 py-4 text-right text-sm font-medium">
										<div class="flex items-center justify-end gap-2">
											{#if article.publishedAt}
												<button
													onclick={() => viewArticle(article.slug)}
													class="text-shark-600 hover:text-shark-900 transition"
													title="Lihat Artikel"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												</button>
											{:else}
												<button
													onclick={() => continueDraft(article.id)}
													class="text-green-600 hover:text-green-900 transition"
													title="Lanjutkan Draft"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 6v6m0 0v6m0-6h6m-6 0H6"
														/>
													</svg>
												</button>
											{/if}
											<button
												onclick={() => editArticle(article.slug)}
												class="text-blue-600 hover:text-blue-900 transition"
												title="Edit Artikel"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
											<form
												id="delete-form-{article.id}"
												method="POST"
												action="?/delete"
												use:enhance={() => {
													return async ({ update }) => {
														await update();
														deletingArticleId = null;
													};
												}}
											>
												<input type="hidden" name="articleId" value={article.id} />
												<button
													type="button"
													onclick={() => confirmDelete(article.id, article.title)}
													disabled={deletingArticleId === article.id}
													class="text-red-600 hover:text-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
													title="Hapus Artikel"
												>
													{#if deletingArticleId === article.id}
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-5 w-5 animate-spin"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
															/>
														</svg>
													{:else}
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-5 w-5"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
													{/if}
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-6">
					<div class="text-center py-12">
						<p class="text-gray-500">Belum ada artikel. Buat artikel pertama Anda untuk memulai!</p>
						<a
							href="/editorial/create"
							class="mt-4 inline-block rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
						>
							Buat Artikel
						</a>
					</div>
				</div>
			{/if}
		</div>

		{#if form?.error}
			<div class="mt-4 rounded-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-sm">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="mt-4 rounded-md bg-green-100 border border-green-400 text-green-700 px-4 py-3 text-sm">
				Artikel berhasil dihapus.
			</div>
		{/if}
	</div>
</main>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	bind:open={showDeleteModal}
	title="Hapus Artikel"
	message={articleToDelete ? `Apakah Anda yakin ingin menghapus artikel "${articleToDelete.title}"?\n\nTindakan ini tidak dapat dibatalkan.` : ''}
	confirmText="Hapus"
	cancelText="Batal"
	type="danger"
	on:confirm={handleDeleteConfirm}
	on:cancel={handleDeleteCancel}
/>
