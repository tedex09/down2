import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}