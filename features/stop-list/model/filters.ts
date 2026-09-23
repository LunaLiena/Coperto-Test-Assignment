'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Shop } from '@/types/menu';

export type ShopFilterValue = Shop | 'all';
export type StatusFilterValue = 'available' | 'stopped' | 'all';

export interface MenuFilters {
  shop: ShopFilterValue;
  status: StatusFilterValue;
}

const SHOP_VALUES: ShopFilterValue[] = ['kitchen', 'bar', 'pastry', 'all'];
const STATUS_VALUES: StatusFilterValue[] = ['available', 'stopped', 'all'];

/** Чистая функция — можно вызвать и на сервере (page.tsx), и на клиенте. */
export function parseFilters(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): MenuFilters {
  const get = (key: string): string | undefined =>
    searchParams instanceof URLSearchParams
      ? (searchParams.get(key) ?? undefined)
      : (Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key]);

  const shopRaw = get('shop');
  const statusRaw = get('status');

  return {
    shop: SHOP_VALUES.includes(shopRaw as ShopFilterValue) ? (shopRaw as ShopFilterValue) : 'all',
    status: STATUS_VALUES.includes(statusRaw as StatusFilterValue)
      ? (statusRaw as StatusFilterValue)
      : 'all',
  };
}

function serializeFilters(filters: MenuFilters): string {
  const params = new URLSearchParams();
  if (filters.shop !== 'all') params.set('shop', filters.shop);
  if (filters.status !== 'all') params.set('status', filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Хранит фильтры в URL (?shop=&status=), переживает перезагрузку и «назад».
 * router.replace (а не push) — чтобы переключение фильтра не плодило
 * отдельную запись истории на каждый клик; сама навигация «назад»
 * по-прежнему возвращает предыдущее состояние фильтров, потому что оно
 * читается из searchParams, а не из локального состояния компонента.
 */
export function useFilters(): {
  filters: MenuFilters;
  setShop: (shop: ShopFilterValue) => void;
  setStatus: (status: StatusFilterValue) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (next: MenuFilters) => {
      router.replace(`${pathname}${serializeFilters(next)}`, { scroll: false });
    },
    [pathname, router],
  );

  const setShop = useCallback(
    (shop: ShopFilterValue) => update({ ...filters, shop }),
    [filters, update],
  );
  const setStatus = useCallback(
    (status: StatusFilterValue) => update({ ...filters, status }),
    [filters, update],
  );

  return { filters, setShop, setStatus };
}
