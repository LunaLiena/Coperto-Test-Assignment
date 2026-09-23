import { StopListPage } from '@/features/stop-list/ui/StopListPage';

interface PageProps {
  searchParams: { shop?: string; status?: string };
}

/**
 * Серверный компонент: сам по себе не делает fetch данных (мок-API и так
 * отвечает быстро, а реального SSR-хранилища нет), но именно здесь
 * читаются searchParams — это осознанная граница между сервером и
 * клиентом: URL как источник правды разбирается один раз «сверху», а
 * дальше клиентский StopListPage подписывается на его изменения сам
 * через useSearchParams (см. features/stop-list/model/filters.ts).
 */
export default function Page({ searchParams }: PageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <StopListPage initialSearchParams={searchParams} />
    </main>
  );
}
