import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

// Create a writable store for toasts
const createToastStore = () => {
	const { subscribe, update } = writable<ToastMessage[]>([]);
	let nextId = 0;

	return {
		subscribe,
		add: (message: string, type: ToastType = 'info', duration = 3000) => {
			const id = (nextId++).toString();
			update((toasts) => [...toasts, { id, message, type, duration }]);
			return id;
		},
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}
	};
};

export const toastStore = createToastStore();

// Convenience functions
export function showNotification(message: string, type: ToastType = 'info', duration = 3000) {
	return toastStore.add(message, type, duration);
}

export function showSuccess(message: string, duration = 3000) {
	return toastStore.add(message, 'success', duration);
}

export function showError(message: string, duration = 4000) {
	return toastStore.add(message, 'error', duration);
}

export function showWarning(message: string, duration = 3000) {
	return toastStore.add(message, 'warning', duration);
}

export function showInfo(message: string, duration = 3000) {
	return toastStore.add(message, 'info', duration);
}

