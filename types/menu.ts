export type Shop = 'kitchen' | 'bar' | 'pastry';

export type StopReason =
  | 'out_of_stock' // закончились продукты
  | 'equipment' // сломалось оборудование
  | 'quality' // вопросы к качеству партии
  | 'menu_change'; // позиция выведена из меню смены

export type MenuItemStatus =
  | { kind: 'available' }
  | {
      kind: 'stopped';
      reason: StopReason;
      until: string | null; // ISO-время или null = до конца смены
    };

export interface MenuItem {
  id: string;
  title: string;
  shop: Shop;
  stock: number; // остаток в штуках, 0..99
  status: MenuItemStatus;
  updatedAt: string; // ISO
}

export interface StopItemPayload {
  reason: StopReason;
  until: string | null;
}

/** Единый порядок причин стопа — используется в селектах и подписях. */
export const STOP_REASONS: readonly StopReason[] = [
  'out_of_stock',
  'equipment',
  'quality',
  'menu_change',
];

export const STOP_REASON_LABELS: Record<StopReason, string> = {
  out_of_stock: 'Закончились продукты',
  equipment: 'Сломалось оборудование',
  quality: 'Вопросы к качеству партии',
  menu_change: 'Выведено из меню смены',
};

export const SHOP_LABELS: Record<Shop, string> = {
  kitchen: 'Кухня',
  bar: 'Бар',
  pastry: 'Кондитерская',
};

/** Ответ API об ошибке — используется и на сервере, и на клиенте. */
export interface ApiErrorBody {
  error: string;
}
