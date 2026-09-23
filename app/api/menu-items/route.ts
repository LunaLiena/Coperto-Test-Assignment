import { NextResponse } from 'next/server';
import { delay, getMenuItems } from '@/server/menu-store';

export async function GET() {
  // Искусственная задержка, чтобы состояние загрузки было видно.
  await delay(700);
  return NextResponse.json(getMenuItems());
}
