// Path: ums-app/src/context/AuthContext.tsx
// Purpose: Autentico-backed authentication context with offline-tolerant boot and sync mode enforcement.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface User {
    id: string;
    name: string;
    role: string;
    org: string;
    orgs: string[];
    dept: string;
    path: string;
    email: string;
    capabilities: string[];
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
export type SyncMode = 'active' | 'upload_only' | 'disabled';

interface AuthContextType {
    user: User | null;
    authState: AuthState;
    syncMode: SyncMode;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [authState, setAuthState] = useState<AuthState>('loading');
    const [syncMode, setSyncMode] = useState<SyncMode>('active');

    useEffect(() => {
        let cancelled = false;

        localStorage.removeItem('ums-current-user');

        async function boot() {
            const cached = await invoke<User | null>('get_cached_user').catch(() => null);
            if (!cancelled && cached) {
                setUser(cached);
                setAuthState('authenticated');
                
                // Immediately validate on boot to check for suspension/revocation
                invoke<{ status: string }>('autentico_validate')
                    .then(res => {
                        if (res.status === 'suspended') setSyncMode('upload_only');
                        else if (res.status === 'revoked') setSyncMode('disabled');
                        else setSyncMode('active');
                    })
                    .catch(() => { /* offline: user keeps working */ });
                return;
            }

            try {
                const refreshed = await invoke<{ token: string; user: User }>('autentico_refresh');
                if (!cancelled && refreshed?.user) {
                    setUser(refreshed.user);
                    setAuthState('authenticated');
                    setSyncMode('active');
                    return;
                }
            } catch {}

            if (!cancelled) setAuthState('unauthenticated');
        }

        boot();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (authState !== 'authenticated') return;
        const interval = setInterval(async () => {
            try {
                const res = await invoke<{ status: string }>('autentico_validate');
                if (res.status === 'suspended') setSyncMode('upload_only');
                else if (res.status === 'revoked') setSyncMode('disabled');
                else setSyncMode('active');
            } catch {}
        }, 6 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [authState]);

    const login = async (username: string, password: string) => {
        const r = await invoke<{ token: string; user: User }>('autentico_login', { username, password });
        setUser(r.user);
        setAuthState('authenticated');
        
        // Immediately validate after login
        try {
            const res = await invoke<{ status: string }>('autentico_validate');
            if (res.status === 'suspended') setSyncMode('upload_only');
            else if (res.status === 'revoked') setSyncMode('disabled');
            else setSyncMode('active');
        } catch {
            setSyncMode('active');
        }
    };

    const logout = async () => {
        if (user) {
            try { await invoke('stop_sync_for_user', { userPath: user.path }); } catch (err) { console.error(err); }
        }
        await invoke('autentico_logout').catch(() => {});
        setUser(null);
        setAuthState('unauthenticated');
        setSyncMode('active');
    };

    return (
        <AuthContext.Provider value={{ user, authState, syncMode, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}