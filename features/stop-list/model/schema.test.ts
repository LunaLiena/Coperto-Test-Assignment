import { describe, it, expect } from 'vitest';
import { validateUntil, stopItemPayloadSchema } from './schema';

describe('validateUntil', () => {
  // Фиксированное "сейчас", выровненное на 15-минутный шаг, чтобы граничные
  // случаи (24ч, шаг) считались предсказуемо.
  const now = new Date('2026-09-23T12:00:00.000Z').getTime();

  it('пропускает null — "до конца смены" всегда валидно', () => {
    expect(validateUntil(null, now)).toBeNull();
  });

  it('отклоняет нераспознаваемую строку времени', () => {
    expect(validateUntil('не-дата', now)).toBe('Некорректное время');
  });

  it('отклоняет время в прошлом', () => {
    const past = new Date(now - 60_000).toISOString();
    expect(validateUntil(past, now)).toBe('Время должно быть в будущем');
  });

  it('отклоняет момент, совпадающий с "сейчас" (граница не включительно)', () => {
    expect(validateUntil(new Date(now).toISOString(), now)).toBe('Время должно быть в будущем');
  });

  it('отклоняет время дальше 24 часов вперёд', () => {
    const tooFar = new Date(now + 24 * 60 * 60_000 + 15 * 60_000).toISOString();
    expect(validateUntil(tooFar, now)).toBe('Не больше чем на 24 часа вперёд');
  });

  it('принимает время ровно через 24 часа (граница включительно)', () => {
    const exactlyLimit = new Date(now + 24 * 60 * 60_000).toISOString();
    expect(validateUntil(exactlyLimit, now)).toBeNull();
  });

  it('отклоняет время, не выровненное на шаг 15 минут', () => {
    const offStep = new Date(now + 20 * 60_000).toISOString();
    expect(validateUntil(offStep, now)).toBe('Шаг — 15 минут');
  });

  it('принимает время, выровненное на шаг 15 минут', () => {
    const onStep = new Date(now + 30 * 60_000).toISOString();
    expect(validateUntil(onStep, now)).toBeNull();
  });
});

describe('stopItemPayloadSchema (тот же путь, что видит route handler)', () => {
  it('отклоняет причину, которой нет в StopReason', () => {
    const result = stopItemPayloadSchema.safeParse({ reason: 'not_a_real_reason', until: null });
    expect(result.success).toBe(false);
  });

  it('принимает валидный payload с "до конца смены"', () => {
    const result = stopItemPayloadSchema.safeParse({ reason: 'out_of_stock', until: null });
    expect(result.success).toBe(true);
  });

  it('прокидывает ошибку validateUntil через superRefine на поле until', () => {
    const result = stopItemPayloadSchema.safeParse({
      reason: 'equipment',
      until: new Date(Date.now() - 1000).toISOString(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['until']);
    }
  });
});
