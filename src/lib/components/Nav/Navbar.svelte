<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ChevronDown, User, LogOut, Settings, FileText } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let { user } = $props();
	let isDropdownOpen = $state(false);
	let isProfileDropdownOpen = $state(false);

	const categories = [
		{ name: 'Olahraga', url: '/category/olahraga' },
		{ name: 'Budaya', url: '/category/budaya' },
		{ name: 'Teknologi', url: '/category/teknologi' },
		{ name: 'Kesehatan', url: '/category/kesehatan' },
		{ name: 'Bencana', url: '/category/bencana' },
		{ name: 'Lainnya', url: '/category/lainnya' }
	];

	function toggleDropdown(event: MouseEvent) {
		event.stopPropagation();
		isDropdownOpen = !isDropdownOpen;
	}

	function closeDropdown() {
		isDropdownOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
			closeProfileDropdown();
		}
	}

	function toggleProfileDropdown(event: MouseEvent) {
		event.stopPropagation();
		isProfileDropdownOpen = !isProfileDropdownOpen;
	}

	function closeProfileDropdown() {
		isProfileDropdownOpen = false;
	}

	function getInitials(username: string | null | undefined): string {
		if (!username) return 'U';
		return username
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<svelte:window onclick={() => { closeDropdown(); closeProfileDropdown(); }} onkeydown={handleKeydown} />

<nav class="w-full bg-shark-950 text-white shadow-md">
	<div class="container mx-auto flex h-16 items-center justify-between px-4 lg:px-16">
		<a href={resolve('/')} class="logo hover:opacity-80">
			<div class="flex h-8 items-center justify-center rounded bg-white/10 px-3 text-sm font-bold text-white">
				Portal Berita
			</div>
		</a>

		<div class="hidden md:block">
			<form
				method="GET"
				action="/search"
				onsubmit={(e) => {
					const form = e.target as HTMLFormElement;
					const input = form.querySelector('input[type="search"]') as HTMLInputElement;
					const query = input.value.trim();
					
					if (query.length < 2) {
						e.preventDefault();
						alert('Masukkan minimal 2 karakter untuk mencari');
						return;
					}
				}}
			>
				<input
					type="search"
					name="q"
					placeholder="Cari Berita..."
					class="search"
					minlength="2"
					required
				/>
			</form>
		</div>

		<div class="flex items-center gap-4">
			{#if user}
				<div class="relative">
					<button
						onclick={toggleProfileDropdown}
						class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus:outline-none overflow-hidden border-2 border-white/30"
						aria-expanded={isProfileDropdownOpen}
						aria-haspopup="true"
						style={user.profilePicture ? `background-image: url('${user.profilePicture}'); background-size: cover; background-position: center;` : ''}
					>
						{#if !user.profilePicture}
							<span class="text-sm font-semibold">{getInitials(user.username)}</span>
						{/if}
					</button>
					{#if isProfileDropdownOpen}
						<div
							class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-shark-950 shadow-xl"
							role="menu"
							transition:slide={{ duration: 200, axis: 'y' }}
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => {
								if (e.key === 'Escape') closeProfileDropdown();
							}}
						>
							<div class="border-b border-white/10 px-4 py-3">
								<p class="text-sm font-semibold text-white">{user.username}</p>
								<p class="text-xs text-gray-400">Masuk</p>
							</div>
							<ul class="py-1">
								<li>
									<a
										href="/settings"
										class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
										onclick={closeProfileDropdown}
									>
										<Settings class="h-4 w-4" />
										Pengaturan
									</a>
								</li>
								<li>
									<a
										href="/editorial"
										class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
										onclick={closeProfileDropdown}
									>
										<FileText class="h-4 w-4" />
										Editorial
									</a>
								</li>
								<li class="border-t border-white/10 mt-1">
									<form method="POST" action="/logout" use:enhance={() => {
										return async ({ update }) => {
											// Invalidate all data after logout to ensure fresh state
											await invalidateAll();
											await update();
										};
									}}>
										<button
											type="submit"
											class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
										>
											<LogOut class="h-4 w-4" />
											Keluar
										</button>
									</form>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/login"
					class="rounded-full px-6 py-2 text-sm font-semibold text-white transition hover:text-gray-500"
				>
					Login
				</a>
			{/if}
		</div>
	</div>

	<div class="h-px w-full bg-white/10"></div>

	<div class="container mx-auto flex h-14 items-center px-4 lg:px-16">
		<!-- Mobile Search -->
		<div class="md:hidden flex-1 mr-4">
			<form
				method="GET"
				action="/search"
				onsubmit={(e) => {
					const form = e.target as HTMLFormElement;
					const input = form.querySelector('input[type="search"]') as HTMLInputElement;
					const query = input.value.trim();
					
					if (query.length < 2) {
						e.preventDefault();
						alert('Masukkan minimal 2 karakter untuk mencari');
						return;
					}
				}}
			>
				<input
					type="search"
					name="q"
					placeholder="Cari Berita..."
					class="search w-full"
					minlength="2"
					required
				/>
			</form>
		</div>

		<ul class="flex gap-8 text-sm font-medium">
			<li>
				<a
					href={resolve('/')}
					class="transition-colors hover:text-white"
					class:dim={page.url.pathname == '/'}
				>
					Beranda
				</a>
			</li>

			<li class="relative">
				<button
					class="flex items-center gap-1 hover:text-gray-300 focus:outline-none"
					onclick={toggleDropdown}
					aria-expanded={isDropdownOpen}
					aria-haspopup="true"
				>
					<span>Kategori</span>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}"
					/>
				</button>

				{#if isDropdownOpen}
					<div
						class="absolute top-full left-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-shark-950 shadow-xl"
						role="menu"
						transition:slide={{ duration: 200, axis: 'y' }}
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => {
							if (e.key === 'Escape') closeDropdown();
						}}
					>
						<ul class="py-1">
							{#each categories as cat (cat.url)}
								<li>
									<a
										class="block w-full px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white"
										onclick={closeDropdown}
										href={cat.url}
									>
										{cat.name}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</li>
		</ul>
	</div>
</nav>

<style lang="postcss">
	@reference "tailwindcss";

	.dim {
		@apply text-white/60;
	}
	.search {
		@apply h-10 w-80 rounded-full border-none bg-white/10 px-5 text-sm text-white ring-1 ring-white/20 transition-all outline-none;
		@apply placeholder:text-white/50;
		@apply focus:bg-white/20 focus:ring-white/50;
	}
</style>
