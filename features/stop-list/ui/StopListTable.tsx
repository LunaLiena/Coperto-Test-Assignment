'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { SHOP_LABELS, STOP_REASON_LABELS, type MenuItem, type MenuItemStatus } from '@/types/menu';

interface StopListTableProps {
  items: MenuItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | undefined;
  pendingStopId?: string | undefined;
  pendingResumeId?: string | undefined;
  onStopClick: (id: string) => void;
  onEditClick: (id: string) => void;
  onResumeClick: (id: string) => void;
}

/**
 * Явный type guard вместо `item.status.kind === 'stopped'`, сохранённого в
 * булеву переменную: булево значение само по себе не переносит узкий тип
 * обратно на `item.status` в JSX-ветках, а type predicate — переносит.
 */
function isStoppedStatus(
  status: MenuItemStatus,
): status is Extract<MenuItemStatus, { kind: 'stopped' }> {
  return status.kind === 'stopped';
}

function formatUntil(until: string | null): string {
  if (until === null) return 'до конца смены';
  const date = new Date(until);
  return `до ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

export function StopListTable({
  items,
  isLoading,
  isError,
  errorMessage,
  pendingStopId,
  pendingResumeId,
  onStopClick,
  onEditClick,
  onResumeClick,
}: StopListTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white py-16 text-sm text-muted">
        <Spinner />
        Загружаем меню смены…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-accent/30 bg-white py-16 text-center">
        <p className="text-sm font-medium text-accent-hover">Не удалось загрузить меню</p>
        <p className="text-xs text-muted">{errorMessage ?? 'Попробуйте обновить страницу'}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line bg-white py-16 text-center">
        <p className="text-sm font-medium text-ink">Ничего не найдено</p>
        <p className="text-xs text-muted">Попробуйте изменить фильтры цеха или статуса</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-xs font-medium uppercase tracking-wide text-muted">
            <th className="w-2/5 px-4 py-3 font-medium">Позиция</th>
            <th className="w-1/6 px-4 py-3 font-medium">Цех</th>
            <th className="w-1/6 px-4 py-3 font-medium">Остаток</th>
            <th className="w-1/5 px-4 py-3 font-medium">Статус</th>
            <th className="w-1/5 px-4 py-3 font-medium text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const status = item.status;
              const isSavingStop = pendingStopId === item.id;
              const isSavingResume = pendingResumeId === item.id;
              const isSaving = isSavingStop || isSavingResume;
              const canResume = item.stock > 0;

              return (
                <motion.tr
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`border-b border-line last:border-b-0 ${isStoppedStatus(status) ? 'bg-canvas/40 text-muted' : 'text-ink'}`}
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{SHOP_LABELS[item.shop]}</td>
                  <td className="px-4 py-3">{item.stock} шт</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isStoppedStatus(status) ? (
                        <button
                          type="button"
                          onClick={() => onEditClick(item.id)}
                          title="Изменить причину или срок"
                          className="rounded-full"
                        >
                          <Badge tone="accent">
                            {STOP_REASON_LABELS[status.reason]} · {formatUntil(status.until)}
                          </Badge>
                        </button>
                      ) : (
                        <Badge tone="success">В продаже</Badge>
                      )}
                      <AnimatePresence>
                        {isSaving && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Badge tone="saving">
                              <Spinner className="h-3 w-3" /> сохраняется
                            </Badge>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isStoppedStatus(status) ? (
                      <Button
                        variant="danger"
                        isLoading={isSavingResume}
                        loadingText="Возвращаем…"
                        disabled={!canResume}
                        title={!canResume ? 'Остаток 0 — сначала пополните запас' : undefined}
                        onClick={() => onResumeClick(item.id)}
                      >
                        Вернуть в продажу
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        isLoading={isSavingStop}
                        loadingText="Ставим в стоп…"
                        onClick={() => onStopClick(item.id)}
                      >
                        В стоп-лист
                      </Button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
