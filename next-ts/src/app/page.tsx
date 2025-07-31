import { Suspense } from 'react';
import ChatPlayground from '@/components/ChatPlayground';

export default function Page() {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatPlayground />
      </Suspense>
    </div>
  );
}