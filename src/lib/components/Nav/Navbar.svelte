<script lang="typescript">
	import { page } from '$app/state';
	import path from 'path';
</script>

<nav class="h-auto w-screen bg-shark-950 text-white">
	<div class="navbar h-16 px-16">
		<button class="logo">
			<a href="/">
				<img src="" alt="logo" />
			</a>
		</button>
		<div>
			<input type="search" placeholder="Cari Berita" class="search" />
		</div>
		<div class="flex flex-row items-center justify-center gap-2">
			<button><a href="/login">Login</a></button>
			<!-- <div class="r h-9 w-9 rounded-full bg-white"></div> -->
		</div>
	</div>
	<div class="divider"></div>
	<div class="navbar">
		<div>
			<ul class="flex gap-6 px-10 text-white">
				<li><button><a href="/" class:dim={page.url.pathname == '/'}>Beranda</a></button></li>
				<li><button><a href="/">Kategori</a></button></li>
			</ul>
		</div>
	</div>
</nav>

<style lang="postcss">
	@reference "tailwindcss";

	a.dim {
		@apply text-white/50;
	}
	.navbar {
		@apply flex items-center justify-between;
		@apply h-full w-screen py-4;
	}

	.search {
		@apply focus:border-none focus:outline-none;
		@apply h-10 w-2xl;
		@apply rounded-3xl;
		@apply placeholder:text-center placeholder:text-slate-300;
		@apply px-4;
	}
	.divider {
		@apply h-px w-screen bg-white;
	}
</style>
