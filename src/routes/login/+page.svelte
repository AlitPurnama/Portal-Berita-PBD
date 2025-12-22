<script lang="ts">
	import { page } from '$app/state';
	import LoginForm from '$lib/components/Login/LoginForm.svelte';
	import RegisterForm from '$lib/components/Login/RegisterForm.svelte';
	
	let type = $derived(page.url.searchParams.get('type') ?? 'login');
	let isRegister = $derived(type === 'register');
	let form = $derived(page.form);
</script>

<main>
	{#if isRegister}
		<RegisterForm form={form} />
	{:else}
		<LoginForm form={form} />
	{/if}
</main>
