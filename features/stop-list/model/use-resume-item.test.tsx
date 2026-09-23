import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useResumeItem } from './use-resume-item';
import { menuKeys } from './queries';
import type { MenuItem } from '@/types/menu';

const initialItems: MenuItem[] = [
  {
    id: '1',
    title: 'Плов с бараниной',
    shop: 'kitchen',
    stock: 4,
    status: { kind: 'stopped', reason: 'equipment', until: null },
    updatedAt: new Date().toISOString(),
  },
];

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * Мок fetch, который не резолвится сам — тест управляет моментом ответа
 * "сервера" вручную, а не полагается на то, что промис резолвится
 * "достаточно медленно". См. use-stop-item.test.tsx — тот же приём и та же
 * причина: иначе onMutate и mutationFn/onError гоняются друг с другом за
 * то, кто первым отработает внутри одного microtask-флаша.
 */
function createControlledFetch() {
  let resolveFn!: (value: { ok: boolean; json: () => Promise<unknown> }) => void;
  const promise = new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
    resolveFn = resolve;
  });
  const fetchMock = vi.fn().mockReturnValue(promise);
  return { fetchMock, resolve: resolveFn };
}

describe('useResumeItem', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(menuKeys.list(), initialItems);
  });

  it('переводит позицию в "available" оптимистично, а при ошибке сервера откатывает обратно в "stopped"', async () => {
    const { fetchMock, resolve } = createControlledFetch();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResumeItem(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate('1');
    });

    // Оптимистичное обновление — статус меняется сразу, "сервер" ещё не
    // ответил.
    await waitFor(() => {
      const items = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
      expect(items?.[0]?.status.kind).toBe('available');
    });

    // Теперь "сервер" отвечает ошибкой.
    resolve({ ok: false, json: async () => ({ error: 'Сервер временно недоступен' }) });

    // После отказа — откат к прежнему состоянию, включая причину и срок.
    await waitFor(() => expect(result.current.isError).toBe(true));

    const itemsAfterRollback = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
    expect(itemsAfterRollback?.[0]?.status).toEqual({
      kind: 'stopped',
      reason: 'equipment',
      until: null,
    });
  });

  it('оставляет позицию в статусе "available" при успешном ответе сервера', async () => {
    const { fetchMock, resolve } = createControlledFetch();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResumeItem(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate('1');
    });

    await waitFor(() => {
      const items = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
      expect(items?.[0]?.status.kind).toBe('available');
    });

    resolve({ ok: true, json: async () => ({ ...initialItems[0], status: { kind: 'available' } }) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const items = queryClient.getQueryData<MenuItem[]>(menuKeys.list());
    expect(items?.[0]?.status.kind).toBe('available');
  });
});
