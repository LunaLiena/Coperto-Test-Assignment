import { NextResponse } from 'next/server';
import { applyResume, delay, findMenuItem, shouldSimulateFailure } from '@/server/menu-store';

interface RouteParams {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = params;

  const item = findMenuItem(id);
  if (!item) {
    return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
  }

  if (item.stock === 0) {
    return NextResponse.json(
      { error: 'Нельзя вернуть в продажу: остаток 0' },
      { status: 400 },
    );
  }

  await delay(600);

  if (shouldSimulateFailure()) {
    return NextResponse.json(
      { error: 'Сервер временно недоступен, попробуйте ещё раз' },
      { status: 500 },
    );
  }

  const updated = applyResume(id);
  if (!updated) {
    return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
