import React from 'react';
import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
}

export { toast };
