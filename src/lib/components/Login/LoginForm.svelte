<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';

	let { form }: { form?: { error?: string } } = $props();
</script>

<form method="POST" action="?/login" use:enhance={({ result }) => {
	return async ({ update, apply, cancel }) => {
		// Check if result is a redirect (successful login)
		if (result && result.type === 'redirect') {
			// Cancel the default redirect
			cancel();
			// Get redirect location from result
			const location = result.location || '/';
			// Invalidate all data first to ensure fresh data is loaded
			await invalidateAll();
			// Then navigate manually with invalidateAll option to refresh all data including layout
			await goto(location, { invalidateAll: true });
		} else {
			// For non-redirect results (errors), just update normally
			await update();
		}
	};
}}>
	<h1 class="mt-2 px-2 py-3 text-center text-xl font-bold">Login</h1>
	<div class="flex flex-col px-5 py-2">
		{#if form?.error}
			<div class="mb-2 rounded bg-red-100 p-2 text-sm text-red-600">{form.error}</div>
		{/if}
		<label class="mt-0!" for="identifier">Username atau Email</label>
		<input type="text" id="identifier" name="identifier" required />
		<label for="password">Password</label>
		<input type="password" id="password" name="password" required />
		<span class="mt-4"
			>Belum punya akun?, daftar <a class="text-violet-400" href="/login?type=register">disini</a
			></span
		>
		<button
			type="submit"
			class="mt-2 mb-4 transform rounded bg-shark-950 p-2 text-white transition-transform duration-150 ease-in-out hover:scale-[101%] hover:cursor-pointer"
		>
			Login
		</button>
	</div>
</form>

<style lang="postcss">
	@reference "tailwindcss";

	label {
		@apply mt-1 text-gray-400;
	}
	input {
		@apply mt-2 min-h-10 rounded bg-gray-200;
	}

	form {
		@apply bg-slate-50;
		@apply rounded border border-gray-200 drop-shadow-md;
		@apply h-fit w-lg;
		@apply /*@apply bg-shark-100;*/ absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform;
	}
</style>
