// Path: ums-app/src/context/ToastContext.tsx
// Purpose: Global toast notification system with persistent error support.

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999999, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                {toasts.map(t => (
                    <div key={t.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--ubv-bg-elevated)', borderLeft: `4px solid ${t.type === 'success' ? 'var(--ubv-success)' : t.type === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-brand-gradient-start)'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div style={{ color: t.type === 'success' ? 'var(--ubv-success)' : t.type === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-brand-gradient-start)', marginTop: '2px' }}>
                            {t.type === 'success' ? <CheckCircle2 size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--ubv-text-main)', wordBreak: 'break-word' }}>
                            {t.message}
                        </div>
                        <button className="icon-btn" onClick={() => removeToast(t.id)} style={{ opacity: 0.5, padding: '2px' }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}