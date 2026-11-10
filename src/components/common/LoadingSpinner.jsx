import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading data...', size = 'md' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className={`${sizeMap[size] || 'w-8 h-8'} animate-spin text-blue-600 mb-3`} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
