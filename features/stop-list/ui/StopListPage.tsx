'use client';

import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { menuItemsQueryOptions } from '../model/queries';
import { parseFilters, useFilters } from '../model/filters';
import { useUIStore } from '../model/ui-store';
import { useStopItem } from '../model/use-stop-item';
import { useResumeItem } from '../model/use-resume-item';
import { Filters } from './Filters';
import { StopListTable } from './StopListTable';
import { StopReasonPanel } from './StopReasonPanel';
import type { MenuItem } from '@/types/menu';

interface StopListPageProps {
  initialSearchParams: { shop?: string; status?: string };
}

function matchesFilters(item: MenuItem, filters: ReturnType<typeof parseFilters>): boolean {
  const shopMatches = filters.shop === 'all' || item.shop === filters.shop;
  const statusMatches = filters.status === 'all' || item.status.kind === filters.status;
  return shopMatches && statusMatches;
}

export function StopListPage({ initialSearchParams }: StopListPageProps) {
  // initialSearchParams передаётся серверным page.tsx и задаёт то же самое
  // значение, которое затем читает клиентский useSearchParams — здесь она
  // не используется напрямую, а служит документацией границы
  // сервер/клиент: URL разбирается один раз "сверху" на сервере и один раз
  // на клиенте тем же чистым parseFilters, так что расхождений быть не может.
  void initialSearchParams;
  const { filters: activeFilters } = useFilters();

  const { data, isLoading, isError, error } = useQuery(menuItemsQueryOptions);
  const stopMutation = useStopItem();
  const resumeMutation = useResumeItem();
  const panelItemId = useUIStore((s) => s.panelItemId);
  const openPanel = useUIStore((s) => s.openPanel);
  const closePanel = useUIStore((s) => s.closePanel);

  const filteredItems = useMemo(
    () => (data ?? []).filter((item) => matchesFilters(item, activeFilters)),
    [data, activeFilters],
  );

  const panelItem = data?.find((item) => item.id === panelItemId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Стоп-лист смены</h1>
        <p className="text-sm text-muted">
          Меню текущей смены. Отметьте позицию как недоступную или верните её в продажу.
        </p>
      </header>

      <Filters />

      <StopListTable
        items={filteredItems}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        pendingStopId={stopMutation.isPending ? stopMutation.variables?.id : undefined}
        pendingResumeId={resumeMutation.isPending ? resumeMutation.variables : undefined}
        onStopClick={(id) => openPanel(id)}
        onEditClick={(id) => openPanel(id)}
        onResumeClick={(id) => resumeMutation.mutate(id)}
      />

      {/* AnimatePresence живёт здесь, а не внутри самой панели: именно
          родитель убирает StopReasonPanel из дерева, когда panelItem
          становится null, и только тут framer-motion может доиграть
          exit-анимацию перед фактическим размонтированием. */}
      <AnimatePresence>
        {panelItem && (
          <StopReasonPanel
            key={panelItem.id}
            item={panelItem}
            isSubmitting={stopMutation.isPending}
            onClose={closePanel}
            onSubmit={(payload) => stopMutation.mutate({ id: panelItem.id, payload })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
