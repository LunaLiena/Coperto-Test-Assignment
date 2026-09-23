import { create } from 'zustand';

/**
 * Только клиентское UI-состояние: какая позиция сейчас редактируется в
 * панели и очередь тостов. Серверные данные (сам список позиций) сюда не
 * попадают — они целиком живут в кэше TanStack Query.
 */

export interface Toast {
  id: string;
  message: string;
  tone: 'error' | 'success';
}

interface UIState {
  panelItemId: string | null;
  openPanel: (itemId: string) => void;
  closePanel: () => void;

  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  panelItemId: null,
  openPanel: (itemId) => set({ panelItemId: itemId }),
  closePanel: () => set({ panelItemId: null }),

  toasts: [],
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
