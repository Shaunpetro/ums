// Path: ums-app/src/context/UploadContext.tsx
// Purpose: Global state provider for managing background uploads across pipeline tabs.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listen } from '@tauri-apps/api/event';

export interface UploadJob {
    id: string;
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

interface UploadContextType {
    uploadQueue: UploadJob[];
    addUpload: (fileName: string) => string;
    failUpload: (id: string, error: string) => void;
    clearUploads: () => void;
    removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploadQueue, setUploadQueue] = useState<UploadJob[]>([]);

    useEffect(() => {
        // Listen for global success events from Rust
        const unlistenSuccess = listen<string>('upload-success', (event) => {
            setUploadQueue(prev => {
                // Find the most recent uploading job and mark it success
                const index = prev.findIndex(job => job.status === 'uploading');
                if (index !== -1) {
                    const newQueue = [...prev];
                    newQueue[index] = { ...newQueue[index], status: 'success' };
                    return newQueue;
                }
                return prev;
            });
        });

        // Listen for global error events from Rust
        const unlistenError = listen<string>('upload-error', (event) => {
            setUploadQueue(prev => {
                const index = prev.findIndex(job => job.status === 'uploading');
                if (index !== -1) {
                    const newQueue = [...prev];
                    newQueue[index] = { ...newQueue[index], status: 'error', error: event.payload };
                    return newQueue;
                }
                return prev;
            });
        });

        return () => {
            unlistenSuccess.then(f => f());
            unlistenError.then(f => f());
        };
    }, []);

    const addUpload = (fileName: string) => {
        const id = Date.now().toString() + Math.random().toString();
        setUploadQueue(prev => {
            const newQueue = [...prev, { id, fileName, status: 'uploading' as const }];
            return newQueue.slice(-5); // Keep max 5
        });
        return id;
    };

    const failUpload = (id: string, error: string) => {
        setUploadQueue(prev => prev.map(job => job.id === id ? { ...job, status: 'error', error } : job));
    };

    const clearUploads = () => setUploadQueue([]);
    
    const removeUpload = (id: string) => {
        setUploadQueue(prev => prev.filter(job => job.id !== id));
    };

    return (
        <UploadContext.Provider value={{ uploadQueue, addUpload, failUpload, clearUploads, removeUpload }}>
            {children}
        </UploadContext.Provider>
    );
}

export function useUploads() {
    const context = useContext(UploadContext);
    if (!context) throw new Error('useUploads must be used within UploadProvider');
    return context;
}