import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuKeys, stopMenuItem } from './queries';
import { useUIStore } from './ui-store';
import type { MenuItem, StopItemPayload } from '@/types/menu';

interface StopVars {
  id: string;
  payload: StopItemPayload;
}

interface MutationContext {
  previous: MenuItem[] | undefined;
}

/**
 * Один инстанс хука используется на весь список (см. StopListPage), а не
 * по одному на строку — так `mutation.isPending` + `mutation.variables.id`
 * однозначно говорит, какая именно строка сейчас "сохраняется".
 */
export function useStopItem() {
  const qc = useQueryClient();
  const pushToast = useUIStore((s) => s.pushToast);
  const closePanel = useUIStore((s) => s.closePanel);
  const listKey = menuKeys.list();

  return useMutation<MenuItem, Error, StopVars, MutationContext>({
    mutationFn: ({ id, payload }) => stopMenuItem(id, payload),

    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<MenuItem[]>(listKey);

      qc.setQueryData<MenuItem[]>(listKey, (items = []) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status: { kind: 'stopped', reason: payload.reason, until: payload.until },
              }
            : item,
        ),
      );

      closePanel();
      return { previous };
    },

    onSuccess: () => {
      pushToast({ message: 'Позиция поставлена в стоп-лист', tone: 'success' });
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      pushToast({ message: error.message || 'Не удалось поставить в стоп-лист', tone: 'error' });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
