import React from 'react';
import { useApp } from '../../context/AppContext';
import { Alert } from '@/components/arc/alert/alert';

export const ToastFeedback: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  const toneMap: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto shadow-md rounded-lg overflow-hidden">
          <Alert
            tone={toneMap[toast.type] || 'info'}
            title={toast.title}
            onDismiss={() => removeToast(toast.id)}
          >
            {toast.message}
          </Alert>
        </div>
      ))}
    </div>
  );
};
