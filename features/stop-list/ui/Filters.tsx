'use client';

import { Select } from '@/shared/ui/Select';
import { SHOP_LABELS } from '@/types/menu';
import { useFilters } from '../model/filters';

const SHOP_OPTIONS = [
  { value: 'all', label: 'Все цеха' },
  { value: 'kitchen', label: SHOP_LABELS.kitchen },
  { value: 'bar', label: SHOP_LABELS.bar },
  { value: 'pastry', label: SHOP_LABELS.pastry },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'available', label: 'В продаже' },
  { value: 'stopped', label: 'В стоп-листе' },
];

export function Filters() {
  const { filters, setShop, setStatus } = useFilters();

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-white p-4">
      <Select
        label="Цех"
        options={SHOP_OPTIONS}
        value={filters.shop}
        onChange={(value) => setShop(value as typeof filters.shop)}
        className="min-w-[10rem]"
      />
      <Select
        label="Статус"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(value) => setStatus(value as typeof filters.status)}
        className="min-w-[10rem]"
      />
    </div>
  );
}
