const STEP_MINUTES = 15;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Дата -> значение для <input type="datetime-local"> в локальном времени. */
export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Ближайшее «будущее» время, выровненное на шаг в 15 минут — дефолт для формы. */
export function roundUpToStep(date: Date, stepMinutes = STEP_MINUTES): Date {
  const ms = stepMinutes * 60_000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

/** ISO-строка (как хранится в статусе позиции) -> значение для datetime-local. */
export function isoToDatetimeLocalValue(iso: string): string {
  return toDatetimeLocalValue(new Date(iso));
}

/** Значение из datetime-local -> абсолютный ISO-момент для отправки на сервер. */
export function datetimeLocalValueToIso(value: string): string {
  return new Date(value).toISOString();
}
