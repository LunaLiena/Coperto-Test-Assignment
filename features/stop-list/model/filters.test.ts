import { describe, it, expect } from 'vitest';
import { parseFilters } from './filters';

describe('parseFilters', () => {
  it('по умолчанию возвращает "все" для обоих фильтров, если параметров нет', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({ shop: 'all', status: 'all' });
  });

  it('читает валидные значения из URLSearchParams (клиентский путь, useFilters)', () => {
    const params = new URLSearchParams('shop=bar&status=stopped');
    expect(parseFilters(params)).toEqual({ shop: 'bar', status: 'stopped' });
  });

  it('читает те же значения из объекта searchParams (серверный путь, app/page.tsx)', () => {
    expect(parseFilters({ shop: 'kitchen', status: 'available' })).toEqual({
      shop: 'kitchen',
      status: 'available',
    });
  });

  it('берёт первое значение, если Next.js передал параметр массивом', () => {
    expect(parseFilters({ shop: ['pastry', 'bar'] })).toEqual({ shop: 'pastry', status: 'all' });
  });

  it('откатывается на "all" при недопустимом/испорченном значении в URL', () => {
    const params = new URLSearchParams('shop=freezer&status=???');
    expect(parseFilters(params)).toEqual({ shop: 'all', status: 'all' });
  });

  it('серверный и клиентский разбор одного и того же URL дают идентичный результат', () => {
    // Прямая проверка утверждения из README: page.tsx (сервер) и useFilters
    // (клиент) используют один и тот же parseFilters, поэтому расхождений
    // при гидратации быть не должно.
    const fromClient = parseFilters(new URLSearchParams('shop=bar&status=stopped'));
    const fromServer = parseFilters({ shop: 'bar', status: 'stopped' });
    expect(fromClient).toEqual(fromServer);
  });
});
