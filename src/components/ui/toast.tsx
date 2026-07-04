'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toast: ToastData) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const toast: ToastData = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    message,
    type,
  };
  toastListeners.forEach(listener => listener(toast));
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const iconColors: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toast: ToastData) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3500);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== addToast);
    };
  }, [addToast]);

  if (!mounted) return null;

  const root = document.getElementById('toast-root');
  if (!root) return null;

  return createPortal(
    <>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast flex items-center gap-3 px-4 py-3 rounded-lg border shadow-elevated min-w-[300px] max-w-[420px] ${colors[toast.type]}`}
        >
          <span className={`flex-shrink-0 w-6 h-6 rounded-full ${iconColors[toast.type]} text-white flex items-center justify-center text-xs font-bold`}>
            {icons[toast.type]}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </>,
    root
  );
}
