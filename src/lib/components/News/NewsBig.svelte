<script lang="ts">
	let { 
		title = 'Title Berita',
		description = '',
		image = '',
		date = '',
		author = '',
		views = 0,
		href = ''
	}: {
		title?: string;
		description?: string;
		image?: string;
		date?: string;
		author?: string;
		views?: number;
		href?: string;
	} = $props();

	function formatDate(dateStr: string | Date | null | undefined): string {
		if (!dateStr) return '';
		const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		return d.toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#if href}
	<a href={href} class="block">
		<div class="news-card">
			{#if image}
				<div
					class="news-image"
					style="background-image: url('{image}');"
				></div>
			{:else}
				<div class="news-image-placeholder"></div>
			{/if}
			<div class="news-content">
				<h2 class="news-title">{title}</h2>
				{#if description}
					<p class="news-description">{description}</p>
				{/if}
				<div class="news-meta">
					<span>{formatDate(date)}</span>
					<span>{views || 0} kali dibaca</span>
				</div>
				{#if author}
					<div class="news-author">Oleh: {author}</div>
				{/if}
			</div>
		</div>
	</a>
{:else}
	<div class="news-card">
		{#if image}
			<div
				class="news-image"
				style="background-image: url('{image}');"
			></div>
		{:else}
			<div class="news-image-placeholder"></div>
		{/if}
		<div class="news-content">
			<h2 class="news-title">{title}</h2>
			{#if description}
				<p class="news-description">{description}</p>
			{/if}
			<div class="news-meta">
				<span>{formatDate(date)}</span>
				<span>{views || 0} kali dibaca</span>
			</div>
			{#if author}
				<div class="news-author">Oleh: {author}</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	
	.news-card {
		@apply rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md;
		@apply h-full flex flex-col;
	}
	
	.news-image {
		@apply h-48 w-full rounded-t-lg bg-cover bg-center;
	}
	
	.news-image-placeholder {
		@apply h-48 w-full rounded-t-lg bg-gray-200;
	}
	
	.news-content {
		@apply p-4 flex-1 flex flex-col;
	}
	
	.news-title {
		@apply mb-2 text-lg font-semibold line-clamp-2;
	}
	
	.news-description {
		@apply mb-3 text-sm text-gray-600 line-clamp-2;
	}
	
	.news-meta {
		@apply flex items-center justify-between text-xs text-gray-500 mt-auto;
	}
	
	.news-author {
		@apply mt-2 text-xs text-gray-500;
	}
</style>
