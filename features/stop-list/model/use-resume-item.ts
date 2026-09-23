import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuKeys, resumeMenuItem } from './queries';
import { useUIStore } from './ui-store';
import type { MenuItem } from '@/types/menu';

interface MutationContext {
  previous: MenuItem[] | undefined;
}

export function useResumeItem() {
  const qc = useQueryClient();
  const pushToast = useUIStore((s) => s.pushToast);
  const listKey = menuKeys.list();

  return useMutation<MenuItem, Error, string, MutationContext>({
    mutationFn: (id) => resumeMenuItem(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<MenuItem[]>(listKey);

      qc.setQueryData<MenuItem[]>(listKey, (items = []) =>
        items.map((item) => (item.id === id ? { ...item, status: { kind: 'available' } } : item)),
      );

      return { previous };
    },

    onSuccess: () => {
      pushToast({ message: 'Позиция возвращена в продажу', tone: 'success' });
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      pushToast({ message: error.message || 'Не удалось вернуть в продажу', tone: 'error' });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
