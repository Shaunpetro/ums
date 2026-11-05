// Path: ums-app/src/context/ToastContext.tsx
// Purpose: Global toast notification system.

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {toasts.map(t => (
                    <div key={t.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '300px', background: 'var(--ubv-bg-elevated)', borderLeft: `4px solid ${t.type === 'success' ? 'var(--ubv-success)' : t.type === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-brand-gradient-start)'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div style={{ color: t.type === 'success' ? 'var(--ubv-success)' : t.type === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-brand-gradient-start)' }}>
                            {t.type === 'success' ? <CheckCircle2 size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--ubv-text-main)' }}>
                            {t.message}
                        </div>
                        <button className="icon-btn" onClick={() => removeToast(t.id)} style={{ opacity: 0.5 }}>
                            <X size={14} />
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