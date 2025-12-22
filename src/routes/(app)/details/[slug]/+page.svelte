<script lang="ts">
	import Category from '$lib/components/Category/Category.svelte';
	import Comment from '$lib/components/Comment/Comment.svelte';
	import NewsBig from '$lib/components/News/NewsBig.svelte';
	import NewsProfileCard from '$lib/components/News/NewsProfileCard.svelte';
	import { marked } from 'marked';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto, invalidate } from '$app/navigation';
	import { showSuccess, showError, showWarning } from '$lib/components/Toast/toastStore';

	let { data, form } = $props();

	let article = $derived(data?.article);
	let author = $derived(data?.author);
	let comments = $state(data?.comments || []);
	// Use $derived to ensure reactivity when navigating between articles
	// This will automatically update when data.user changes
	// data.user comes from +page.server.ts which gets it from locals.user (always fresh)
	let currentUser = $derived(data?.user);
	
	// Force reactivity: ensure currentUser updates when data changes
	// This is important when user logs in/out while on this page
	$effect(() => {
		// Access data.user to ensure reactivity tracking
		const _ = data?.user;
	});
	let articleId = $derived(data?.articleId);
	let articleViews = $state(data?.article?.views || 0);
	let relatedArticles = $derived(data?.relatedArticles || []);

	// Cooldown state untuk mencegah spam komentar
	let commentCooldown = $state(0);
	let isSubmitting = $state(false);
	const COMMENT_COOLDOWN_SECONDS = 5; // 5 detik cooldown

	// Configure marked for full markdown support
	marked.setOptions({
		gfm: true, // GitHub Flavored Markdown
		breaks: true, // Convert line breaks to <br>
		pedantic: false, // Don't be pedantic
		silent: false // Show errors
	});

	function formatDate(date: Date | null | string | undefined): string {
		if (!date) return '';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	let contentHtml = $derived.by(() => {
		if (!article?.content) return '';
		try {
			return marked.parse(article.content);
		} catch (error) {
			console.error('Error parsing markdown:', error);
			return '<p class="text-red-500">Error parsing content</p>';
		}
	});

	function getInitials(username: string | null | undefined): string {
		if (!username) return 'U';
		return username
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function formatCommentDate(date: Date | null | string | undefined): string {
		if (!date) return '';
		const d = typeof date === 'string' ? new Date(date) : date;
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Baru saja';
		if (minutes < 60) return `${minutes} menit yang lalu`;
		if (hours < 24) return `${hours} jam yang lalu`;
		if (days < 7) return `${days} hari yang lalu`;
		return d.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Cooldown timer - ensure it runs continuously
	let cooldownTimer: ReturnType<typeof setInterval> | null = null;
	$effect(() => {
		if (commentCooldown > 0) {
			if (cooldownTimer) {
				clearInterval(cooldownTimer);
			}
			cooldownTimer = setInterval(() => {
				commentCooldown--;
				if (commentCooldown <= 0) {
					if (cooldownTimer) {
						clearInterval(cooldownTimer);
						cooldownTimer = null;
					}
				}
			}, 1000);
			return () => {
				if (cooldownTimer) {
					clearInterval(cooldownTimer);
					cooldownTimer = null;
				}
			};
		} else {
			if (cooldownTimer) {
				clearInterval(cooldownTimer);
				cooldownTimer = null;
			}
		}
	});

	// Note: Form submission is now handled directly in the enhance callback
	// to prevent session reset. This $effect is kept as fallback for edge cases.

	// Track view counter - only increment once per device
	$effect(() => {
		if (articleId && typeof window !== 'undefined') {
			const VIEWED_KEY = `article_viewed_${articleId}`;
			const hasViewed = localStorage.getItem(VIEWED_KEY);
			
			if (!hasViewed) {
				// Mark as viewed
				localStorage.setItem(VIEWED_KEY, 'true');
				
				// Increment view counter via API
				fetch(`/api/increment-view/${articleId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				})
					.then((res) => res.json())
					.then((data) => {
						if (data.success && article) {
							// Update views locally without reloading
							articleViews = (article.views || 0) + 1;
						}
					})
					.catch((err) => {
						console.error('Error incrementing view counter:', err);
					});
			}
		}
	});

	// Update comments when data changes
	$effect(() => {
		if (data?.comments) {
			comments = data.comments;
		}
	});

	// Update views when data changes
	$effect(() => {
		if (data?.article?.views !== undefined) {
			articleViews = data.article.views;
		}
	});

	// Update currentUser when data changes (important for navigation between articles)
	$effect(() => {
		// Force reactivity by accessing data.user
		// This ensures currentUser updates when navigating to different articles
		if (data?.user !== undefined) {
			// currentUser is already derived from data.user, but this effect ensures reactivity
		}
	});
</script>

<svelte:head>
	<title>{article?.title || 'Artikel'} - Portal Berita</title>
	{#if article?.excerpt}
		<meta name="description" content={article.excerpt} />
	{/if}
</svelte:head>

<main>
	{#if article}
		<div class="container mx-auto my-10 px-4 lg:px-16">
			<div class="info-berita">
				<div class="-translate-x-3.5 transform">
					<Category Text={article.category} Size="Medium" />
				</div>
				<div class="mt-4">
					<h1 class="text-xl font-semibold">{article.title}</h1>
					{#if article.excerpt}
						<p class="mt-2 text-gray-600">{article.excerpt}</p>
					{/if}
				</div>
				<div class="mt-2 mb-2 flex gap-10 font-light text-gray-500">
					<p>Tanggal: {formatDate(article.publishedAt || article.createdAt)}</p>
					<p>Dibaca: {articleViews} kali</p>
				</div>
				{#if author}
					<div class="container mx-auto w-full gap-5 rounded bg-gray-300 px-5 py-2">
						<div class="flex items-center gap-4">
							<div
								class="profile-picture h-16 w-16 rounded-full bg-gray-400 border bg-cover bg-center bg-no-repeat transform transition-transform ease-in-out hover:scale-105 flex items-center justify-center text-white font-semibold text-lg"
								style={author.profilePicture ? `background-image: url('${author.profilePicture}')` : ''}
							>
								{#if !author.profilePicture}
									{getInitials(author.username)}
								{/if}
							</div>
							<div class="max-w-9/12">
								<h1 class="font-semibold">{author.fullName || author.username}</h1>
								<p>Penulis Artikel</p>
								{#if author.aboutMe}
									<p class="text-justify text-gray-700">{author.aboutMe}</p>
								{:else}
									<p class="text-justify text-gray-700">
										Penulis artikel di Portal Berita PBD
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}
				{#if article.featuredImage}
					<div
						style="background-image: url('{article.featuredImage}');"
						class="news-image"
					></div>
				{/if}
				<div class="news-text">
					{@html contentHtml}
				</div>
				<div class="share">
				<p>Share Berita</p>
				<div class="placeholder">
					<button class="" aria-label="Share on facebook">
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							transform="rotate(0 0 0)"
						>
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M17.625 3H6.375C4.51105 3 3 4.51105 3 6.375V17.625C3 19.4889 4.51105 21 6.375 21H17.625C19.4889 21 21 19.4889 21 17.625V6.375C21 4.51105 19.4889 3 17.625 3ZM17.1679 12.6939H15.4839V18.9276H12.6703V12.6939H11.5784V10.5932H12.6703V9.255C12.6703 7.50237 13.3997 6.46026 15.465 6.46026H17.5587V8.55158H16.3413C15.5361 8.55158 15.4839 8.85237 15.4839 9.41132L15.4816 10.5908H17.3953L17.1655 12.6916L17.1679 12.6939Z"
								fill="#3766e9"
							/>
						</svg>
					</button>
					<button aria-label="Share on mesengger">
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							transform="rotate(0 0 0)"
						>
							<path
								d="M11.9677 2.02539C6.35484 2.02539 2 6.15442 2 11.7028C2 14.6383 3.19355 17.1544 5.12903 18.8641C5.25806 18.9931 5.35484 19.2189 5.3871 19.4125L5.41935 21.1867C5.45161 21.7351 6 22.1544 6.54839 21.8964L8.54839 21.0254C8.67742 20.9931 8.90323 20.9286 9.09677 20.9931C10 21.2189 10.9677 21.4125 12 21.4125C17.6452 21.3802 22 17.2512 22 11.7351C22 6.21894 17.6129 2.02539 11.9677 2.02539ZM17.9677 9.477L15.0323 14.0899C14.5806 14.7996 13.5806 15.0576 12.9032 14.5093L10.5806 12.7351C10.3548 12.606 10.0968 12.606 9.87097 12.7351L6.70968 15.0899C6.29032 15.4125 5.74194 14.8964 6.03226 14.4447L8.96774 9.83184C9.41936 9.12216 10.4194 8.8641 11.0968 9.41248L13.4194 11.1867C13.6452 11.3157 13.9032 11.3157 14.129 11.1867L17.2581 8.76732C17.7419 8.57377 18.2258 9.05765 17.9677 9.477Z"
								fill="#3766e9"
							/>
						</svg>
					</button>
					<button aria-label="Share on instagram">
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							transform="rotate(0 0 0)"
							><path
								d="M8.6672 12C8.6672 10.1591 10.1591 8.6664 12 8.6664C13.8409 8.6664 15.3336 10.1591 15.3336 12C15.3336 13.8409 13.8409 15.3336 12 15.3336C10.1591 15.3336 8.6672 13.8409 8.6672 12ZM6.86512 12C6.86512 14.836 9.164 17.1349 12 17.1349C14.836 17.1349 17.1349 14.836 17.1349 12C17.1349 9.164 14.836 6.86512 12 6.86512C9.164 6.86512 6.86512 9.164 6.86512 12ZM16.1382 6.66152C16.1381 6.89886 16.2084 7.13089 16.3401 7.32829C16.4719 7.52568 16.6593 7.67956 16.8785 7.77047C17.0977 7.86138 17.339 7.88525 17.5718 7.83904C17.8046 7.79283 18.0185 7.67862 18.1863 7.51087C18.3542 7.34311 18.4686 7.12934 18.515 6.89658C18.5614 6.66382 18.5377 6.42253 18.447 6.20322C18.3563 5.98392 18.2025 5.79644 18.0052 5.6645C17.808 5.53257 17.576 5.4621 17.3386 5.462H17.3382C17.02 5.46215 16.715 5.58856 16.49 5.81347C16.265 6.03837 16.1384 6.34339 16.1382 6.66152ZM7.96 20.1398C6.98504 20.0954 6.45512 19.933 6.10296 19.7958C5.63608 19.614 5.30296 19.3975 4.95272 19.0478C4.60248 18.698 4.38568 18.3652 4.20472 17.8983C4.06744 17.5463 3.90504 17.0162 3.86072 16.0413C3.81224 14.9872 3.80256 14.6706 3.80256 12.0001C3.80256 9.3296 3.81304 9.01384 3.86072 7.95888C3.90512 6.98392 4.06872 6.45488 4.20472 6.10184C4.38648 5.63496 4.60296 5.30184 4.95272 4.9516C5.30248 4.60136 5.63528 4.38456 6.10296 4.2036C6.45496 4.06632 6.98504 3.90392 7.96 3.8596C9.01408 3.81112 9.33072 3.80144 12 3.80144C14.6693 3.80144 14.9862 3.81192 16.0412 3.8596C17.0162 3.904 17.5452 4.0676 17.8982 4.2036C18.3651 4.38456 18.6982 4.60184 19.0485 4.9516C19.3987 5.30136 19.6147 5.63496 19.7965 6.10184C19.9338 6.45384 20.0962 6.98392 20.1405 7.95888C20.189 9.01384 20.1986 9.3296 20.1986 12.0001C20.1986 14.6706 20.189 14.9863 20.1405 16.0413C20.0961 17.0162 19.9329 17.5462 19.7965 17.8983C19.6147 18.3652 19.3982 18.6983 19.0485 19.0478C18.6987 19.3972 18.3651 19.614 17.8982 19.7958C17.5462 19.933 17.0162 20.0954 16.0412 20.1398C14.9871 20.1882 14.6705 20.1979 12 20.1979C9.32952 20.1979 9.01376 20.1882 7.96 20.1398ZM7.8772 2.06056C6.81264 2.10904 6.0852 2.27784 5.44992 2.52504C4.792 2.78032 4.23504 3.1228 3.67848 3.67848C3.12192 4.23416 2.78032 4.792 2.52504 5.44992C2.27784 6.0856 2.10904 6.81264 2.06056 7.8772C2.01128 8.94344 2 9.28432 2 12C2 14.7157 2.01128 15.0566 2.06056 16.1228C2.10904 17.1874 2.27784 17.9144 2.52504 18.5501C2.78032 19.2076 3.122 19.7661 3.67848 20.3215C4.23496 20.877 4.792 21.219 5.44992 21.475C6.0864 21.7222 6.81264 21.891 7.8772 21.9394C8.944 21.9879 9.28432 22 12 22C14.7157 22 15.0566 21.9887 16.1228 21.9394C17.1874 21.891 17.9144 21.7222 18.5501 21.475C19.2076 21.219 19.765 20.8772 20.3215 20.3215C20.8781 19.7658 21.219 19.2076 21.475 18.5501C21.7222 17.9144 21.8918 17.1874 21.9394 16.1228C21.9879 15.0558 21.9992 14.7157 21.9992 12C21.9992 9.28432 21.9879 8.94344 21.9394 7.8772C21.891 6.81256 21.7222 6.0852 21.475 5.44992C21.219 4.7924 20.8772 4.23504 20.3215 3.67848C19.7658 3.12192 19.2076 2.78032 18.5509 2.52504C17.9144 2.27784 17.1874 2.10824 16.1236 2.06056C15.0574 2.01208 14.7165 2 12.0008 2C9.28512 2 8.944 2.01128 7.8772 2.06056Z"
								fill="#3f1414"
							/><path
								d="M8.6672 12C8.6672 10.1591 10.1591 8.6664 12 8.6664C13.8409 8.6664 15.3336 10.1591 15.3336 12C15.3336 13.8409 13.8409 15.3336 12 15.3336C10.1591 15.3336 8.6672 13.8409 8.6672 12ZM6.86512 12C6.86512 14.836 9.164 17.1349 12 17.1349C14.836 17.1349 17.1349 14.836 17.1349 12C17.1349 9.164 14.836 6.86512 12 6.86512C9.164 6.86512 6.86512 9.164 6.86512 12ZM16.1382 6.66152C16.1381 6.89886 16.2084 7.13089 16.3401 7.32829C16.4719 7.52568 16.6593 7.67956 16.8785 7.77047C17.0977 7.86138 17.339 7.88525 17.5718 7.83904C17.8046 7.79283 18.0185 7.67862 18.1863 7.51087C18.3542 7.34311 18.4686 7.12934 18.515 6.89658C18.5614 6.66382 18.5377 6.42253 18.447 6.20322C18.3563 5.98392 18.2025 5.79644 18.0052 5.6645C17.808 5.53257 17.576 5.4621 17.3386 5.462H17.3382C17.02 5.46215 16.715 5.58856 16.49 5.81347C16.265 6.03837 16.1384 6.34339 16.1382 6.66152ZM7.96 20.1398C6.98504 20.0954 6.45512 19.933 6.10296 19.7958C5.63608 19.614 5.30296 19.3975 4.95272 19.0478C4.60248 18.698 4.38568 18.3652 4.20472 17.8983C4.06744 17.5463 3.90504 17.0162 3.86072 16.0413C3.81224 14.9872 3.80256 14.6706 3.80256 12.0001C3.80256 9.3296 3.81304 9.01384 3.86072 7.95888C3.90512 6.98392 4.06872 6.45488 4.20472 6.10184C4.38648 5.63496 4.60296 5.30184 4.95272 4.9516C5.30248 4.60136 5.63528 4.38456 6.10296 4.2036C6.45496 4.06632 6.98504 3.90392 7.96 3.8596C9.01408 3.81112 9.33072 3.80144 12 3.80144C14.6693 3.80144 14.9862 3.81192 16.0412 3.8596C17.0162 3.904 17.5452 4.0676 17.8982 4.2036C18.3651 4.38456 18.6982 4.60184 19.0485 4.9516C19.3987 5.30136 19.6147 5.63496 19.7965 6.10184C19.9338 6.45384 20.0962 6.98392 20.1405 7.95888C20.189 9.01384 20.1986 9.3296 20.1986 12.0001C20.1986 14.6706 20.189 14.9863 20.1405 16.0413C20.0961 17.0162 19.9329 17.5462 19.7965 17.8983C19.6147 18.3652 19.3982 18.6983 19.0485 19.0478C18.6987 19.3972 18.3651 19.614 17.8982 19.7958C17.5462 19.933 17.0162 20.0954 16.0412 20.1398C14.9871 20.1882 14.6705 20.1979 12 20.1979C9.32952 20.1979 9.01376 20.1882 7.96 20.1398ZM7.8772 2.06056C6.81264 2.10904 6.0852 2.27784 5.44992 2.52504C4.792 2.78032 4.23504 3.1228 3.67848 3.67848C3.12192 4.23416 2.78032 4.792 2.52504 5.44992C2.27784 6.0856 2.10904 6.81264 2.06056 7.8772C2.01128 8.94344 2 9.28432 2 12C2 14.7157 2.01128 15.0566 2.06056 16.1228C2.10904 17.1874 2.27784 17.9144 2.52504 18.5501C2.78032 19.2076 3.122 19.7661 3.67848 20.3215C4.23496 20.877 4.792 21.219 5.44992 21.475C6.0864 21.7222 6.81264 21.891 7.8772 21.9394C8.944 21.9879 9.28432 22 12 22C14.7157 22 15.0566 21.9887 16.1228 21.9394C17.1874 21.891 17.9144 21.7222 18.5501 21.475C19.2076 21.219 19.765 20.8772 20.3215 20.3215C20.8781 19.7658 21.219 19.2076 21.475 18.5501C21.7222 17.9144 21.8918 17.1874 21.9394 16.1228C21.9879 15.0558 21.9992 14.7157 21.9992 12C21.9992 9.28432 21.9879 8.94344 21.9394 7.8772C21.891 6.81256 21.7222 6.0852 21.475 5.44992C21.219 4.7924 20.8772 4.23504 20.3215 3.67848C19.7658 3.12192 19.2076 2.78032 18.5509 2.52504C17.9144 2.27784 17.1874 2.10824 16.1236 2.06056C15.0574 2.01208 14.7165 2 12.0008 2C9.28512 2 8.944 2.01128 7.8772 2.06056Z"
								fill="#3f1414"
							/></svg
						>
					</button>
					<button aria-label="Share on whatsapp">
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							transform="rotate(0 0 0)"
							><path
								d="M19.074 4.89389C17.2091 3.02894 14.6689 2 12.0644 2C6.59814 2 2.12869 6.4373 2.12869 11.9035C2.12869 13.672 2.57885 15.3441 3.44702 16.8875L2.03223 22L7.33769 20.6495C8.78464 21.4212 10.4245 21.8714 12.0965 21.8714C17.5306 21.8392 21.9679 17.4019 21.9679 11.9035C21.9679 9.26688 20.939 6.791 19.074 4.89389ZM12.0322 20.1672C10.5853 20.1672 9.07403 19.7492 7.82001 18.9775L7.49846 18.7846L4.37949 19.5884L5.24766 16.5659L5.05473 16.2444C4.25088 14.926 3.80072 13.3826 3.80072 11.8392C3.80072 7.30547 7.46631 3.63987 12.0322 3.63987C14.2187 3.63987 16.2766 4.50804 17.82 6.05145C19.3634 7.59486 20.2316 9.68489 20.2316 11.9035C20.2959 16.5016 16.566 20.1672 12.0322 20.1672ZM16.566 13.9936C16.3088 13.865 15.119 13.254 14.8297 13.2219C14.6046 13.1254 14.4116 13.0932 14.283 13.3505C14.1544 13.6077 13.6399 14.1222 13.5113 14.3151C13.3827 14.4437 13.2541 14.508 12.9647 14.3473C12.7075 14.2187 11.9358 13.9936 10.9711 13.0932C10.2316 12.4502 9.71711 11.6463 9.62065 11.3569C9.49203 11.0997 9.5885 11.0032 9.74927 10.8424C9.87788 10.7138 10.0065 10.5852 10.103 10.3923C10.2316 10.2637 10.2316 10.135 10.3602 9.97428C10.4888 9.84566 10.3924 9.65274 10.328 9.52412C10.2316 9.3955 9.78142 8.17364 9.55634 7.65917C9.36342 7.1447 9.13834 7.24116 9.00972 7.24116C8.8811 7.24116 8.68817 7.24116 8.55956 7.24116C8.43094 7.24116 8.1094 7.27331 7.91647 7.5627C7.69139 7.81994 7.0483 8.43087 7.0483 9.65273C7.0483 10.8746 7.91647 12 8.07724 12.2251C8.20586 12.3537 9.84573 14.8939 12.2895 15.9871C12.8682 16.2444 13.3184 16.4051 13.7043 16.5338C14.283 16.7267 14.8297 16.6624 15.2477 16.6302C15.73 16.5981 16.6946 16.0514 16.9197 15.4405C17.1126 14.8939 17.1126 14.3473 17.0483 14.2508C16.984 14.1865 16.7911 14.09 16.566 13.9936Z"
								fill="#5ddb8d"
							/></svg
						>
					</button>
				</div>
				</div>
				<div class="comment-section">
					<h3 class="mb-4 text-xl font-semibold">Komentar ({comments.length || 0})</h3>
					{#if currentUser}
						<form method="POST" action="?/postComment" use:enhance={() => {
							// Check cooldown before submission
							if (commentCooldown > 0) {
								showWarning(`Tunggu ${commentCooldown} detik sebelum mengirim komentar lagi`);
								return () => {}; // Prevent submission
							}
							
							// Check if user is still logged in before submission
							if (!currentUser) {
								showError('Anda harus login untuk mengirim komentar');
								goto(`/login?redirect=${encodeURIComponent(page.url.pathname)}`);
								return () => {}; // Prevent submission
							}
							
							isSubmitting = true;
							return async ({ result }) => {
								try {
									// Check if result is a redirect (session expired)
									if (result && result.type === 'redirect') {
										// User was redirected to login, this means session expired
										// Let the redirect happen naturally
										isSubmitting = false;
										return;
									}
									
									// For success case, handle immediately without calling update()
									// This prevents session reset that happens when update() reloads data
									if (result && result.type === 'success') {
										// Handle success immediately
										showSuccess('Komentar berhasil diposting!');
										// Set cooldown immediately to prevent spam
										commentCooldown = COMMENT_COOLDOWN_SECONDS;
										// Reset form
										const formElement = document.getElementById('comment-form') as HTMLFormElement;
										if (formElement) {
											formElement.reset();
										}
										// Fetch new comments directly
										if (article?.id) {
											const fetchComments = (attempt = 1) => {
												const delay = attempt * 200; // 200ms, 400ms, 600ms
												setTimeout(() => {
													fetch(`/api/comments/${article.id}?t=${Date.now()}`)
														.then((res) => {
															if (!res.ok) throw new Error('Failed to fetch comments');
															return res.json();
														})
														.then((data) => {
															if (data.comments && Array.isArray(data.comments)) {
																comments = data.comments;
															} else if (attempt < 3) {
																fetchComments(attempt + 1);
															}
														})
														.catch((err) => {
															console.error('Error fetching comments:', err);
															if (attempt < 3) {
																fetchComments(attempt + 1);
															}
														});
												}, delay);
											};
											fetchComments();
										}
										isSubmitting = false;
										// Return early to prevent default update
										return;
									}
									
									// For errors, handle directly without update()
									if (result && result.type === 'failure' && result.data) {
										const errorData = result.data as { error?: string };
										if (errorData.error) {
											showError(errorData.error);
										}
									}
									isSubmitting = false;
								} catch (error) {
									console.error('Error submitting comment:', error);
									isSubmitting = false;
								} finally {
									// Ensure isSubmitting is reset even if update doesn't complete properly
									setTimeout(() => {
										isSubmitting = false;
									}, 100);
								}
							};
						}} id="comment-form">
							<textarea
								class="min-h-24 w-full rounded border border-gray-300 bg-gray-50 p-3 focus:border-shark-500 focus:outline-none focus:ring-shark-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
								name="comment"
								id="comment"
								placeholder="Apa yang kamu pikirkan?"
								required
								maxlength="2000"
								disabled={isSubmitting || commentCooldown > 0}
							></textarea>
							<div class="mt-3 flex w-full items-center justify-between">
								<div class="flex items-center gap-2">
									<p class="text-xs text-gray-500">Maksimal 2000 karakter</p>
									{#if commentCooldown > 0}
										<span class="text-xs text-orange-600 font-medium">
											Tunggu {commentCooldown} detik
										</span>
									{/if}
								</div>
								<button
									type="submit"
									class="rounded-md bg-shark-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-800 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
									disabled={isSubmitting || commentCooldown > 0}
								>
									{#if isSubmitting}
										Mengirim...
									{:else if commentCooldown > 0}
										Tunggu {commentCooldown}s
									{:else}
										Post Komentar
									{/if}
								</button>
							</div>
						</form>
					{:else}
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
							<p class="mb-4 text-gray-600">Anda harus login untuk mengirim komentar</p>
							<a
								href="/login?redirect={encodeURIComponent(page.url.pathname)}"
								class="inline-block rounded-md bg-shark-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-800"
							>
								Login
							</a>
						</div>
					{/if}
					<div class="mt-10 flex flex-col gap-4">
						{#if comments.length > 0}
							{#each comments as comment}
								<div class="comment-item">
									<div class="comment-avatar">
										<div
											class="h-10 w-10 rounded-full bg-gray-300 border border-gray-300 bg-cover bg-center flex items-center justify-center text-white font-semibold text-sm overflow-hidden shadow-sm"
											style={comment.user.profilePicture ? `background-image: url('${comment.user.profilePicture}')` : ''}
										>
											{#if !comment.user.profilePicture}
												{getInitials(comment.user.username)}
											{/if}
										</div>
									</div>
									<div class="comment-content">
										<div class="comment-header">
											<span class="comment-username">{comment.user.username}</span>
											<span class="comment-time">{formatCommentDate(comment.createdAt)}</span>
										</div>
										<div class="comment-text">
											{comment.content}
										</div>
									</div>
								</div>
							{/each}
						{:else}
							<div class="py-8 text-center text-gray-500">
								<p>Belum ada komentar. Jadilah yang pertama berkomentar!</p>
							</div>
						{/if}
					</div>
				</div>
			{#if relatedArticles.length > 0}
				<p class="mt-10 mb-5">Artikel Terkait</p>
				<div class="artikel-terkait">
					{#each relatedArticles as relatedArticle}
						<NewsBig
							title={relatedArticle.title}
							description={relatedArticle.excerpt || ''}
							image={relatedArticle.featuredImage || ''}
							date={relatedArticle.publishedAt ? new Date(relatedArticle.publishedAt).toISOString() : (relatedArticle.createdAt ? new Date(relatedArticle.createdAt).toISOString() : '')}
							author={relatedArticle.author?.username || ''}
							views={relatedArticle.views || 0}
							href="/details/{relatedArticle.slug}"
						/>
					{/each}
				</div>
			{/if}
			</div>
		</div>
	{:else}
		<div class="container mx-auto my-10">
			<div class="text-center py-12">
				<p class="text-gray-500">Artikel tidak ditemukan</p>
			</div>
		</div>
	{/if}
</main>

<style lang="postcss">
	@reference "tailwindcss";

	.artikel-terkait {
		@apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6;
	}
	.comment-section {
		@apply relative mt-5;
	}
	.comment-item {
		@apply flex gap-3 items-start;
	}
	.comment-avatar {
		@apply shrink-0;
	}
	.comment-content {
		@apply flex-1 min-w-0;
	}
	.comment-header {
		@apply flex items-center gap-2 mb-1;
	}
	.comment-username {
		@apply font-semibold text-gray-900 text-sm;
	}
	.comment-time {
		@apply text-xs text-gray-500;
	}
	.comment-text {
		@apply text-gray-700 text-sm leading-relaxed whitespace-pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
	.share > .placeholder > button {
		@apply h-fit w-fit;
		@apply transform transition-all hover:scale-105 hover:cursor-pointer;
	}

	.share > .placeholder {
		@apply mt-2 flex gap-1;
	}

	.news-image {
		@apply mt-5 h-128 w-full rounded bg-cover bg-center bg-no-repeat;
	}
	.info-berita {
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
		@apply hover:underline;
	}
	.news-text :global(img) {
		@apply max-w-full h-auto rounded-md my-4;
	}
	.news-text :global(table) {
		@apply w-full border-collapse mb-4 mt-4;
	}
	.news-text :global(table th),
	.news-text :global(table td) {
		@apply border border-gray-300 px-4 py-2 text-left;
	}
	.news-text :global(table th) {
		@apply bg-gray-100 font-semibold;
	}
	.news-text :global(table tr:nth-child(even)) {
		@apply bg-gray-50;
	}
	.news-text :global(hr) {
		@apply border-t border-gray-300 my-6;
	}
	.news-text :global(del) {
		@apply line-through text-gray-500;
	}
	.news-text :global(mark) {
		@apply bg-yellow-200 px-1 rounded;
	}
	.news-text :global(sub),
	.news-text :global(sup) {
		@apply text-xs;
	}
	.news-text :global(kbd) {
		@apply bg-gray-100 border border-gray-300 rounded px-2 py-1 font-mono text-sm;
	}
	.news-text :global(abbr[title]) {
		@apply cursor-help border-b border-dotted border-gray-400;
	}
	.news-text :global(details) {
		@apply mb-4;
	}
	.news-text :global(summary) {
		@apply cursor-pointer font-semibold mb-2;
	}
	.news-text :global(details[open] summary) {
		@apply mb-2;
	}
	.share {
		@apply mt-10;
	}
</style>
