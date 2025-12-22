<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { error } = $props();

	let status = $derived(error?.status || 404);
	let message = $derived(error?.message || 'Halaman tidak ditemukan');

	function goHome() {
		goto('/');
	}

	function goBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>{status} - Portal Berita</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
	<div class="max-w-2xl w-full text-center">
		<!-- Animated 404 Number -->
		<div class="mb-8">
			<h1 class="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-shark-600 to-shark-900 animate-pulse">
				{status}
			</h1>
		</div>

		<!-- Error Message -->
		<div class="mb-8">
			<h2 class="text-3xl font-bold text-gray-800 mb-4">
				Oops! {message}
			</h2>
			<p class="text-lg text-gray-600 mb-2">
				{#if status === 404}
					Halaman yang Anda cari tidak ditemukan atau mungkin telah dipindahkan.
				{:else if status === 500}
					Terjadi kesalahan pada server. Tim kami sedang memperbaikinya.
				{:else}
					Terjadi kesalahan yang tidak terduga.
				{/if}
			</p>
		</div>

		<!-- Illustration -->
		<div class="mb-12 flex justify-center">
			<div class="relative">
				<!-- SVG Illustration -->
				<svg
					class="w-64 h-64 text-gray-300"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<!-- Floating elements -->
				<div class="absolute top-0 left-0 w-4 h-4 bg-shark-500 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
				<div class="absolute top-8 right-4 w-3 h-3 bg-shark-400 rounded-full animate-bounce" style="animation-delay: 0.5s;"></div>
				<div class="absolute bottom-4 left-8 w-2 h-2 bg-shark-600 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<button
				onclick={goHome}
				class="flex items-center gap-2 px-6 py-3 bg-shark-950 text-white rounded-lg font-semibold hover:bg-shark-900 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Kembali ke Beranda
			</button>
			<button
				onclick={goBack}
				class="flex items-center gap-2 px-6 py-3 bg-white text-shark-950 border-2 border-shark-950 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
				Kembali
			</button>
		</div>

		<!-- Helpful Links -->
		<div class="mt-12 pt-8 border-t border-gray-200">
			<p class="text-sm text-gray-500 mb-4">Atau coba kunjungi:</p>
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/"
					class="text-shark-600 hover:text-shark-800 hover:underline text-sm font-medium"
				>
					Beranda
				</a>
				<a
					href="/category/olahraga"
					class="text-shark-600 hover:text-shark-800 hover:underline text-sm font-medium"
				>
					Olahraga
				</a>
				<a
					href="/category/teknologi"
					class="text-shark-600 hover:text-shark-800 hover:underline text-sm font-medium"
				>
					Teknologi
				</a>
				<a
					href="/category/kesehatan"
					class="text-shark-600 hover:text-shark-800 hover:underline text-sm font-medium"
				>
					Kesehatan
				</a>
			</div>
		</div>
	</div>
</main>

<style>
	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}
</style>

