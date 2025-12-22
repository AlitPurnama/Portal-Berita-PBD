<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ConfirmModal from '$lib/components/Modal/ConfirmModal.svelte';
	import { showSuccess, showError, showWarning, showInfo } from '$lib/components/Toast/toastStore';

	let { data, form } = $props();

	let showDeleteModal = $state(false);
	let confirmDeleteText = $state('');

	// Profile picture upload
	let profilePictureFile = $state<File | null>(null);
	let profilePicturePreview = $state<string | null>(null);
	let isUploadingProfile = $state(false);

	function getInitials(username: string | null | undefined): string {
		if (!username) return 'U';
		return username
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
		if (type === 'success') {
			showSuccess(message);
		} else if (type === 'error') {
			showError(message);
		} else if (type === 'warning') {
			showWarning(message);
		} else {
			showInfo(message);
		}
	}

	function handleDeleteConfirm() {
		const form = document.getElementById('delete-account-form') as HTMLFormElement;
		if (form) {
			form.requestSubmit();
		}
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
		confirmDeleteText = '';
	}

	async function handleProfilePictureUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Validate file
		if (file.size > 2 * 1024 * 1024) {
			showNotification('Ukuran file terlalu besar. Maksimal 2MB.', 'error');
			return;
		}

		if (!file.type.startsWith('image/')) {
			showNotification('File harus berupa gambar.', 'error');
			return;
		}

		profilePictureFile = file;
		isUploadingProfile = true;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			profilePicturePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Upload to server
		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/upload-image', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Gagal mengupload gambar');
			}

			const result = await response.json();
			// Use medium size for profile picture
			const profilePictureUrl = result.images.medium;
			
			// Update profile picture in form
			const profileForm = document.getElementById('profile-form') as HTMLFormElement;
			if (profileForm) {
				const hiddenInput = profileForm.querySelector('input[name="profilePicture"]') as HTMLInputElement;
				if (hiddenInput) {
					hiddenInput.value = profilePictureUrl;
				}
			}

			showNotification('Foto profil berhasil diupload. Klik "Simpan Perubahan" untuk menyimpan.', 'success');
		} catch (error: any) {
			console.error('Upload error:', error);
			showNotification(error.message || 'Gagal mengupload foto profil', 'error');
			profilePictureFile = null;
			profilePicturePreview = null;
		} finally {
			isUploadingProfile = false;
		}
	}

	function removeProfilePicture() {
		profilePictureFile = null;
		profilePicturePreview = null;
		const profileForm = document.getElementById('profile-form') as HTMLFormElement;
		if (profileForm) {
			const hiddenInput = profileForm.querySelector('input[name="profilePicture"]') as HTMLInputElement;
			if (hiddenInput) {
				hiddenInput.value = '';
			}
		}
	}

	// Show toast notifications based on form results
	$effect(() => {
		if (form) {
			// In SvelteKit, form result is directly in form prop with action name as key
			// Handle updateProfile result
			const updateProfileResult = form.updateProfile;
			if (updateProfileResult) {
				if (typeof updateProfileResult === 'object') {
					if ('success' in updateProfileResult && updateProfileResult.success) {
						showNotification(updateProfileResult.message || 'Profil berhasil diperbarui', 'success');
					} else if ('error' in updateProfileResult) {
						showNotification(updateProfileResult.error as string, 'error');
					}
				}
			}

			// Handle updatePassword result
			const updatePasswordResult = form.updatePassword;
			if (updatePasswordResult) {
				if (typeof updatePasswordResult === 'object') {
					if ('success' in updatePasswordResult && updatePasswordResult.success) {
						showNotification(updatePasswordResult.message || 'Password berhasil diperbarui', 'success');
					} else if ('error' in updatePasswordResult) {
						showNotification(updatePasswordResult.error as string, 'error');
					}
				}
			}

			// Handle deleteAccount result
			const deleteAccountResult = form.deleteAccount;
			if (deleteAccountResult) {
				if (typeof deleteAccountResult === 'object' && 'error' in deleteAccountResult) {
					showNotification(deleteAccountResult.error as string, 'error');
				}
				// Note: Success case redirects, so no toast needed
			}
		}
	});

	// Load existing profile picture
	onMount(() => {
		if (data?.user?.profilePicture) {
			profilePicturePreview = data.user.profilePicture;
		}
	});
</script>

<svelte:head>
	<title>Pengaturan - Portal Berita</title>
</svelte:head>

<main class="container mx-auto my-10 px-4 lg:px-16">
	<div class="mx-auto max-w-2xl">
		<h1 class="mb-8 text-3xl font-bold">Pengaturan</h1>

		<!-- Profile Card (mengikuti style NewsProfileCard) -->
		{#if data?.user}
			<div class="container mx-auto mb-6 w-full gap-5 rounded bg-gray-300 px-5 py-2">
				<div class="flex items-center gap-4">
					<div
						class="profile-picture h-16 w-16 rounded-full bg-gray-400 border bg-cover bg-center bg-no-repeat transform transition-transform ease-in-out hover:scale-105 flex items-center justify-center text-white font-semibold text-lg"
						style={profilePicturePreview || data.user.profilePicture ? `background-image: url('${profilePicturePreview || data.user.profilePicture}')` : ''}
					>
						{#if !profilePicturePreview && !data.user.profilePicture}
							{getInitials(data.user.username)}
						{/if}
					</div>
					<div class="max-w-9/12">
						<h1 class="font-semibold">{data.user.username}</h1>
						<p>Pengguna Portal Berita</p>
						<p class="text-justify text-gray-700">
							{data.user.aboutMe || 'Kelola pengaturan akun Anda di sini. Anda dapat mengubah informasi profil, kata sandi, dan pengaturan lainnya.'}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="space-y-6">
			<!-- Profile Settings -->
			<section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold">Pengaturan Profil</h2>
				<form id="profile-form" method="POST" action="?/updateProfile" use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}} class="space-y-4">
					<input type="hidden" name="profilePicture" value={profilePicturePreview || data?.user?.profilePicture || ''} />
					
					<!-- Profile Picture Upload -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Foto Profil</label>
						<div class="flex items-center gap-4">
							<div class="relative">
								<div
									class="h-24 w-24 rounded-full bg-gray-300 border-2 border-gray-400 bg-cover bg-center flex items-center justify-center text-white font-semibold text-xl overflow-hidden"
									style={profilePicturePreview || data?.user?.profilePicture ? `background-image: url('${profilePicturePreview || data?.user?.profilePicture}')` : ''}
								>
									{#if !profilePicturePreview && !data?.user?.profilePicture}
										{getInitials(data?.user?.username)}
									{/if}
								</div>
								{#if isUploadingProfile}
									<div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
										<svg
											class="h-6 w-6 animate-spin text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									</div>
								{/if}
							</div>
							<div class="flex-1">
								<label
									for="profile-picture-upload"
									class="inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
								>
									{profilePicturePreview || data?.user?.profilePicture ? 'Ganti Foto' : 'Upload Foto'}
								</label>
								<input
									id="profile-picture-upload"
									type="file"
									accept="image/*"
									onchange={handleProfilePictureUpload}
									class="hidden"
								/>
								{#if profilePicturePreview || data?.user?.profilePicture}
									<button
										type="button"
										onclick={removeProfilePicture}
										class="ml-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
									>
										Hapus Foto
									</button>
								{/if}
								<p class="mt-2 text-xs text-gray-500">Format: JPG, PNG, WebP. Maksimal 2MB</p>
							</div>
						</div>
					</div>
					<div>
						<label for="fullName" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
						<input
							type="text"
							id="fullName"
							name="fullName"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Masukkan nama lengkap Anda"
							value={data?.user?.fullName || ''}
							required
						/>
					</div>
					<div>
						<label for="username" class="block text-sm font-medium text-gray-700">Nama Pengguna</label>
						<input
							type="text"
							id="username"
							name="username"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Masukkan nama pengguna Anda"
							value={data?.user?.username || ''}
							required
						/>
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Masukkan email Anda"
							value={data?.user?.email || ''}
							required
						/>
					</div>
					<div>
						<label for="aboutme" class="block text-sm font-medium text-gray-700">Tentang Saya</label>
						<textarea
							id="aboutme"
							name="aboutme"
							rows="4"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Ceritakan sedikit tentang diri Anda..."
							maxlength="500"
						>{data?.user?.aboutMe || ''}</textarea>
						<p class="mt-1 text-xs text-gray-500">Maksimal 500 karakter</p>
					</div>
					<button
						type="submit"
						class="rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
					>
						Simpan Perubahan
					</button>
				</form>
			</section>

			<!-- Password Settings -->
			<section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold">Ubah Kata Sandi</h2>
				<form method="POST" action="?/updatePassword" use:enhance={({ result }) => {
					return async ({ update }) => {
						await update();
						// Toast will be shown by $effect watching form prop
					};
				}} class="space-y-4">
					<div>
						<label for="current-password" class="block text-sm font-medium text-gray-700"
							>Kata Sandi Saat Ini</label
						>
						<input
							type="password"
							id="current-password"
							name="current-password"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Masukkan kata sandi saat ini"
							required
						/>
					</div>
					<div>
						<label for="new-password" class="block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
						<input
							type="password"
							id="new-password"
							name="new-password"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Masukkan kata sandi baru"
							minlength="6"
							required
						/>
					</div>
					<div>
						<label for="confirm-password" class="block text-sm font-medium text-gray-700"
							>Konfirmasi Kata Sandi Baru</label
						>
						<input
							type="password"
							id="confirm-password"
							name="confirm-password"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-shark-500 focus:outline-none focus:ring-shark-500"
							placeholder="Konfirmasi kata sandi baru"
							minlength="6"
							required
						/>
					</div>
					<button
						type="submit"
						class="rounded-md bg-shark-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-shark-900"
					>
						Perbarui Kata Sandi
					</button>
				</form>
			</section>

			<!-- Account Settings -->
			<section class="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-red-600">Zona Berbahaya</h2>
				<div class="space-y-4">
					<p class="text-sm text-gray-600">
						Setelah Anda menghapus akun, tidak ada cara untuk mengembalikannya. Semua artikel dan data Anda akan dihapus secara permanen. Harap pastikan.
					</p>
					<button
						type="button"
						onclick={() => (showDeleteModal = true)}
						class="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
					>
						Hapus Akun
					</button>
				</div>
			</section>
		</div>
	</div>
</main>

<!-- Delete Account Confirmation Modal -->
{#if showDeleteModal}
	<ConfirmModal
		bind:open={showDeleteModal}
		title="Hapus Akun"
		confirmText="Hapus Akun"
		cancelText="Batal"
		type="danger"
		on:confirm={handleDeleteConfirm}
		on:cancel={handleDeleteCancel}
	>
		<div>
			<p class="mb-4 text-sm text-gray-600 whitespace-pre-line">
				Apakah Anda yakin ingin menghapus akun Anda?

				Tindakan ini akan menghapus:
				- Semua artikel yang Anda buat
				- Semua data profil Anda
				- Semua sesi login

				Tindakan ini TIDAK DAPAT DIBATALKAN.
			</p>
			<div class="mb-4">
				<label for="confirm-delete" class="block text-sm font-medium text-gray-700 mb-2">
					Ketik <span class="font-bold text-red-600">HAPUS</span> untuk konfirmasi:
				</label>
				<input
					type="text"
					id="confirm-delete"
					bind:value={confirmDeleteText}
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500"
					placeholder="HAPUS"
				/>
			</div>
		</div>
	</ConfirmModal>
{/if}

<!-- Hidden form for delete account -->
<form id="delete-account-form" method="POST" action="?/deleteAccount" use:enhance={({ result }) => {
	return async ({ update }) => {
		await update();
		// Toast will be shown by $effect watching form prop
	};
}}>
	<input type="hidden" name="confirmText" value={confirmDeleteText} />
</form>

