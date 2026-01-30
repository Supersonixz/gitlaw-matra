'use client';

import DeepLinkView from '@/components/DeepLinkView';
import { fetchConstitutionData, ConstitutionData } from '@/utils/dataLoader';
import { useState, useEffect } from 'react';
import WelcomeHero from '@/components/WelcomeHero';

const DEFAULT_LEFT_ID = 'con2475temp';
const DEFAULT_RIGHT_ID = 'con2475';

export default function SemanticDiffPage() {
  const [data, setData] = useState<{ left: ConstitutionData; right: ConstitutionData } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [left, right] = await Promise.all([
          fetchConstitutionData(DEFAULT_LEFT_ID),
          fetchConstitutionData(DEFAULT_RIGHT_ID)
        ]);
        setData({ left, right });
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError(true);
      }
    };
    initData();
  }, []);

  if (error) {
    return <div className="p-10 text-center text-red-500">Failed to load application data.</div>;
  }

  if (!data) {
    return (
      <main className="bg-slate-200 font-sans min-h-screen flex flex-col">
        <div className="relative z-10">
          <WelcomeHero />
        </div>
        <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
          Loading constitution data...
        </div>
      </main>
    );
  }

  return (
    <DeepLinkView
      initialLeftId={DEFAULT_LEFT_ID}
      initialRightId={DEFAULT_RIGHT_ID}
      initialLeftData={data.left}
      initialRightData={data.right}
    />
  );
}