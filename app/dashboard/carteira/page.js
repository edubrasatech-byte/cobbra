'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CarteiraPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-secondary-theme text-xs font-semibold">Redirecionando para Cobbra Pay...</span>
      </div>
    </div>
  );
}
