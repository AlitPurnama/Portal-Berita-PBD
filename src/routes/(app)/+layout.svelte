<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Nav/Navbar.svelte';
	import ToastContainer from '$lib/components/Toast/ToastContainer.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar user={data.user}></Navbar>
{@render children?.()}
<ToastContainer />
