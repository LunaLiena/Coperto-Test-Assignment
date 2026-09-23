import { z } from 'zod';
import { STOP_REASONS } from '@/types/menu';

const MAX_AHEAD_MS = 24 * 60 * 60 * 1000;
const STEP_MS = 15 * 60 * 1000;

/**
 * Чистая функция валидации срока стопа — ровно то, что дано в примере
 * задания. Используется внутри Zod-схемы через superRefine, так что
 * правило проверяется один раз, но применяется и на клиенте, и на сервере.
 */
export function validateUntil(value: string | null, now = Date.now()): string | null {
  if (value === null) return null; // до конца смены — всегда валидно
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return 'Некорректное время';
  if (ts <= now) return 'Время должно быть в будущем';
  if (ts - now > MAX_AHEAD_MS) return 'Не больше чем на 24 часа вперёд';
  if (ts % STEP_MS !== 0) return 'Шаг — 15 минут';
  return null;
}

/**
 * Форма работает с двумя полями (untilMode + untilValue: `null` пока режим
 * "до конца смены", иначе значение datetime-local), а payload на сервер и
 * в кэш уходит уже свёрнутым до `until: string | null` — см.
 * formValuesToPayload ниже. Правило валидации срока (validateUntil) при
 * этом одно и то же и для формы, и для route handler'а.
 */
export const stopItemFormSchema = z
  .object({
    reason: z.enum(STOP_REASONS as unknown as [string, ...string[]], {
      errorMap: () => ({ message: 'Выберите причину стопа' }),
    }),
    untilMode: z.enum(['shift', 'custom']),
    untilValue: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.untilMode === 'custom') {
      const error = validateUntil(data.untilValue);
      if (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
          path: ['untilValue'],
        });
      }
    }
  });

export type StopItemFormValues = z.infer<typeof stopItemFormSchema>;

/** То, что реально уходит по сети и хранится в API — payload без untilMode. */
export const stopItemPayloadSchema = z
  .object({
    reason: z.enum(STOP_REASONS as unknown as [string, ...string[]]),
    until: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    const error = validateUntil(data.until);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ['until'] });
    }
  });

export function formValuesToPayload(values: StopItemFormValues) {
  return {
    reason: values.reason,
    until: values.untilMode === 'shift' ? null : values.untilValue,
  };
}
