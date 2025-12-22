import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get data from URL search params (passed from create page)
	const judul = url.searchParams.get('judul') || '';
	const kategori = url.searchParams.get('kategori') || '';
	const tanggal = url.searchParams.get('tanggal') || '';
	const gambar = url.searchParams.get('gambar') || '';
	const excerpt = url.searchParams.get('excerpt') || '';
	const konten = url.searchParams.get('konten') || '';

	return {
		judul: decodeURIComponent(judul),
		kategori: decodeURIComponent(kategori),
		tanggal: decodeURIComponent(tanggal),
		gambar: decodeURIComponent(gambar),
		excerpt: decodeURIComponent(excerpt),
		konten: decodeURIComponent(konten)
	};
};

