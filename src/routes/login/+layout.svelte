<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();
	let type = $derived(page.url.searchParams.get('type') ?? 'login');
	let isRegister = $derived(type === 'register');
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
</svelte:head>

<header>
	<div class="relative flex items-center justify-center bg-shark-950 p-4 text-white">
		<a href={resolve('/')} class="absolute left-4 font-medium hover:text-gray-300"> Kembali </a>
		<p class="text-lg font-semibold">
			{#if isRegister}
				Register
			{:else}
				Login
			{/if}
		</p>
	</div>
</header>

{@render children?.()}
