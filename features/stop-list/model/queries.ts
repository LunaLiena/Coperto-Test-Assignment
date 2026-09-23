import { queryOptions } from '@tanstack/react-query';
import type { ApiErrorBody, MenuItem, StopItemPayload } from '@/types/menu';

/**
 * Один ключ на весь список. Датасет маленький (12-15 позиций), сервер не
 * умеет фильтровать — поэтому вместо отдельного кэш-ключа под каждую
 * комбинацию фильтров (shop+status) мы держим один источник правды и
 * фильтруем уже в компоненте (см. useFilteredItems). Это упрощает
 * оптимистичные обновления: патчить нужно ровно одну запись кэша, а не
 * гадать, в каких из N списков сейчас лежит эта позиция.
 */
export const menuKeys = {
  all: ['menu-items'] as const,
  list: () => [...menuKeys.all, 'list'] as const,
};

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error ?? 'Не удалось выполнить запрос';
    throw new Error(message);
  }
  return data as T;
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await fetch('/api/menu-items');
  return parseJsonOrThrow<MenuItem[]>(response);
}

export const menuItemsQueryOptions = queryOptions({
  queryKey: menuKeys.list(),
  queryFn: fetchMenuItems,
});

export async function stopMenuItem(id: string, payload: StopItemPayload): Promise<MenuItem> {
  const response = await fetch(`/api/menu-items/${id}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<MenuItem>(response);
}

export async function resumeMenuItem(id: string): Promise<MenuItem> {
  const response = await fetch(`/api/menu-items/${id}/resume`, { method: 'POST' });
  return parseJsonOrThrow<MenuItem>(response);
}
