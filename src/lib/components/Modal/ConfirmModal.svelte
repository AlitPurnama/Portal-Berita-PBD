<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let { open = $bindable(false), title = 'Konfirmasi', message = '', confirmText = 'Ya', cancelText = 'Batal', type = 'danger' } = $props();

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
		open = false;
	}

	function handleCancel() {
		dispatch('cancel');
		open = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		aria-describedby="modal-description"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal -->
		<div
			class="relative w-full max-w-md transform rounded-lg bg-white shadow-xl"
			onclick={(e) => e.stopPropagation()}
			transition:fly={{ y: -20, duration: 200 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h3 id="modal-title" class="text-lg font-semibold text-gray-900">{title}</h3>
				<button
					type="button"
					onclick={handleCancel}
					class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-shark-500"
					aria-label="Tutup"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="px-6 py-4">
				{#if message}
					<p id="modal-description" class="text-sm text-gray-600 whitespace-pre-line">{message}</p>
				{/if}
				<slot />
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
				<button
					type="button"
					onclick={handleCancel}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-shark-500 focus:ring-offset-2"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="rounded-md px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 {type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-shark-950 hover:bg-shark-900 focus:ring-shark-500'}"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}


