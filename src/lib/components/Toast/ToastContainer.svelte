<script lang="ts">
	import Toast from './Toast.svelte';
	import { toastStore } from './toastStore';
	import { onMount, onDestroy } from 'svelte';

	let toasts = $state<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; duration: number }>>([]);
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		// Subscribe to updates
		unsubscribe = toastStore.subscribe((value) => {
			toasts = [...value];
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each toasts as toast (toast.id)}
		<Toast
			open={true}
			message={toast.message}
			type={toast.type}
			duration={toast.duration}
			onclose={() => toastStore.remove(toast.id)}
		/>
	{/each}
</div>

