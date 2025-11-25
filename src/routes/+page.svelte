<script>
	import Hero from '$lib/components/Hero/Hero.svelte';
	import NewsBig from '$lib/components/News/NewsBig.svelte';
</script>

<main class="container mx-auto mt-10 w-screen">
	<section id="hero">
		<Hero></Hero>
	</section>
	<section id="latest-news">
		<span>Berita Terkini</span>
		<div class="latest-placeholder">
			<NewsBig></NewsBig>
			<NewsBig></NewsBig>
			<NewsBig></NewsBig>
		</div>
	</section>
</main>

<style lang="postcss">
	@reference "tailwindcss";
	section {
		@apply my-8;
	}
	.latest-placeholder {
		@apply flex items-center justify-between;
		@apply mt-4;
	}
</style>
