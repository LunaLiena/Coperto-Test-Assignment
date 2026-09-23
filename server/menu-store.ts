import type { MenuItem, StopItemPayload } from '@/types/menu';

/**
 * Данные живут в памяти процесса, как и требует задание.
 *
 * Важно (описано и в README): на serverless-платформах вроде Vercel
 * инстанс функции не гарантированно переиспользуется между запросами,
 * поэтому это состояние может «сбрасываться» к исходному сиду в любой
 * момент — это ожидаемое поведение мок-бэкенда, а не баг.
 */

function isoInMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function createSeed(): MenuItem[] {
  const now = new Date().toISOString();

  return [
    { id: '1', title: 'Борщ с говядиной', shop: 'kitchen', stock: 12, status: { kind: 'available' }, updatedAt: now },
    { id: '2', title: 'Цезарь с курицей', shop: 'kitchen', stock: 0, status: { kind: 'stopped', reason: 'out_of_stock', until: null }, updatedAt: now },
    { id: '3', title: 'Стейк рибай', shop: 'kitchen', stock: 4, status: { kind: 'available' }, updatedAt: now },
    { id: '4', title: 'Паста карбонара', shop: 'kitchen', stock: 9, status: { kind: 'available' }, updatedAt: now },
    { id: '5', title: 'Плов с бараниной', shop: 'kitchen', stock: 0, status: { kind: 'stopped', reason: 'equipment', until: isoInMinutes(90) }, updatedAt: now },
    { id: '6', title: 'Гриль-сет из овощей', shop: 'kitchen', stock: 15, status: { kind: 'available' }, updatedAt: now },
    { id: '7', title: 'Апероль шприц', shop: 'bar', stock: 20, status: { kind: 'available' }, updatedAt: now },
    { id: '8', title: 'Мохито безалкогольный', shop: 'bar', stock: 6, status: { kind: 'available' }, updatedAt: now },
    { id: '9', title: 'Крафтовый лимонад', shop: 'bar', stock: 0, status: { kind: 'stopped', reason: 'menu_change', until: null }, updatedAt: now },
    { id: '10', title: 'Эспрессо тоник', shop: 'bar', stock: 11, status: { kind: 'available' }, updatedAt: now },
    { id: '11', title: 'Тирамису', shop: 'pastry', stock: 7, status: { kind: 'available' }, updatedAt: now },
    { id: '12', title: 'Чизкейк Нью-Йорк', shop: 'pastry', stock: 3, status: { kind: 'available' }, updatedAt: now },
    { id: '13', title: 'Круассан с миндалём', shop: 'pastry', stock: 0, status: { kind: 'stopped', reason: 'quality', until: isoInMinutes(240) }, updatedAt: now },
  ];
}

// В dev-режиме Next.js модуль может пересоздаваться при hot-reload —
// храним стор в globalThis, чтобы состояние не сбрасывалось на каждый save.
const globalForStore = globalThis as unknown as { __menuStore?: MenuItem[] };

function getStore(): MenuItem[] {
  if (!globalForStore.__menuStore) {
    globalForStore.__menuStore = createSeed();
  }
  return globalForStore.__menuStore;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** ~20% случаев — имитация сбоя сервера. */
export function shouldSimulateFailure(): boolean {
  return Math.random() < 0.2;
}

export function getMenuItems(): MenuItem[] {
  return getStore();
}

export function findMenuItem(id: string): MenuItem | undefined {
  return getStore().find((item) => item.id === id);
}

export function applyStop(id: string, payload: StopItemPayload): MenuItem | null {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = store[index]!;
  const updated: MenuItem = {
    ...current,
    status: { kind: 'stopped', reason: payload.reason, until: payload.until },
    updatedAt: new Date().toISOString(),
  };
  store[index] = updated;
  return updated;
}

export function applyResume(id: string): MenuItem | null {
  const store = getStore();
  const index = store.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = store[index]!;
  const updated: MenuItem = {
    ...current,
    status: { kind: 'available' },
    updatedAt: new Date().toISOString(),
  };
  store[index] = updated;
  return updated;
}
