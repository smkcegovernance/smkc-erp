'use client';
import { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'error';

const TOAST_EVENT_NAME = 'smkc:toast';

type ToastPayload = {
  message: string;
  type: ToastType;
};

export function showToast(message: string, type: ToastType = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT_NAME, {
      detail: { message, type },
    })
  );
}

function inferToastType(message: string): ToastType {
  const text = message.toLowerCase();
  if (/(success|created|published|authorized|finalized|submitted|registered|deleted)/.test(text)) {
    return 'success';
  }
  if (/(fail|failed|error|invalid|unauthor|forbidden|not found|cannot|expired)/.test(text)) {
    return 'error';
  }
  return 'info';
}

function installAlertBridge() {
  if (typeof window === 'undefined' || (window as any).__smkcAlertBridgeInstalled) return;
  (window as any).__smkcAlertBridgeInstalled = true;

  const nativeAlert = window.alert.bind(window);
  (window as any).__smkcNativeAlert = nativeAlert;

  window.alert = (message?: any) => {
    const text = typeof message === 'string' ? message : String(message ?? '');
    if (!text.trim()) return;
    showToast(text, inferToastType(text));
  };
}

export function Toast({ message, type = 'info', fixed = true }: { message: string; type?: ToastType; fixed?: boolean }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const styleByType = {
    success: 'border-emerald-300/60 bg-emerald-50/95 text-emerald-900 shadow-emerald-300/25',
    error: 'border-rose-300/60 bg-rose-50/95 text-rose-900 shadow-rose-300/25',
    info: 'border-sky-300/60 bg-sky-50/95 text-sky-900 shadow-sky-300/25',
  };

  const iconByType = {
    success: '✓',
    error: '!',
    info: 'i',
  };

  return (
    <div
      className={`${fixed ? 'fixed bottom-4 right-4 w-[min(92vw,24rem)]' : 'w-full'} rounded-xl border px-4 py-3 backdrop-blur-md shadow-xl ${styleByType[type]} animate-[toastIn_.2s_ease-out]`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-sm font-bold">
          {iconByType[type]}
        </span>
        <p className="text-sm font-medium leading-5">{message}</p>
      </div>
    </div>
  );
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  useEffect(() => {
    installAlertBridge();

    const onToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message: detail.message, type: detail.type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4300);
    };

    window.addEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast message={toast.message} type={toast.type} fixed={false} />
        </div>
      ))}
      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
