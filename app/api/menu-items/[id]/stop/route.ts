import { NextResponse } from 'next/server';
import { applyStop, delay, findMenuItem, shouldSimulateFailure } from '@/server/menu-store';
import { stopItemPayloadSchema } from '@/features/stop-list/model/schema';
import type { StopReason } from '@/types/menu';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = params;

  const item = findMenuItem(id);
  if (!item) {
    return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = stopItemPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Некорректные данные формы';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Та же задержка и та же вероятность отказа, что описаны в задании для
  // оптимистичного обновления — применяем её и к постановке, и к снятию.
  await delay(600);

  if (shouldSimulateFailure()) {
    return NextResponse.json(
      { error: 'Сервер временно недоступен, попробуйте ещё раз' },
      { status: 500 },
    );
  }

  const updated = applyStop(id, {
    reason: parsed.data.reason as StopReason,
    until: parsed.data.until,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
