import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useStopItem } from './use-stop-item';
import { menuKeys } from './queries';
import type { MenuItem } from '@/types/menu';

const initialItems: MenuItem[] = [
  {
    id: '1',
    title: 'Борщ с говядиной',
    shop: 'kitchen',
    stock: 5,
    status: { kind: 'available' },
    updatedAt: new Date().toISOString(),
  },
];

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useStopItem', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(menuKeys.list(), initialItems);
  });

  it('применяет статус оптимистично, а при ошибке сервера откатывает его назад', async () => {
    // ~20%-ный сбой route handler'а из задания имитируем детерминированно
    // через мок fetch, а не полагаемся на реальную вероятность.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Сервер временно недоступен' }),
      }),
    );

    const { result } = renderHook(() => useStopItem(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: '1', payload: { reason: 'out_of_stock', until: null } });
    });

    // 1. Оптимистичное обновление: статус меняется сразу, до ответа "сервера".
    await waitFor(() => {
      const items = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
      expect(items?.[0]?.status.kind).toBe('stopped');
    });

    // 2. После отказа сервера — откат к прежнему состоянию.
    await waitFor(() => expect(result.current.isError).toBe(true));

    const itemsAfterRollback = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
    expect(itemsAfterRollback?.[0]?.status.kind).toBe('available');
  });

  it('оставляет позицию в статусе "стоп" при успешном ответе сервера', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...initialItems[0],
          status: { kind: 'stopped', reason: 'equipment', until: null },
        }),
      }),
    );

    const { result } = renderHook(() => useStopItem(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: '1', payload: { reason: 'equipment', until: null } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const items = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
    expect(items?.[0]?.status.kind).toBe('stopped');
  });
});
