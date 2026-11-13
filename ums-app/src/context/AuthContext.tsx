// Path: ums-app/src/context/AuthContext.tsx
// Purpose: Autentico-backed authentication context with offline-tolerant boot
//          (RS256 verify + local expiry + clock guard in Rust via get_cached_user).

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

interface AuthContextType {
    user: User | null;
    authState: AuthState;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [authState, setAuthState] = useState<AuthState>('loading');

    useEffect(() => {
        let cancelled = false;

        // Clean up pre-05a localStorage. JWT in keyring is now the source of truth.
        localStorage.removeItem('ums-current-user');

        async function boot() {
            // Step 1: local-only checks in Rust (RS256 signature, exp, clock guard).
            const cached = await invoke<User | null>('get_cached_user').catch(() => null);
            if (!cancelled && cached) {
                setUser(cached);
                setAuthState('authenticated');
                // Best-effort background validate. Never blocks, never logs out per DEC-058.
                invoke('autentico_validate').catch(() => { /* offline: user keeps working */ });
                return;
            }

            // Step 2: try refresh. Handles clock drift / slight expiry edge cases
            // when the LAN Autentico is reachable but the local token is stale.
            try {
                const refreshed = await invoke<{ token: string; user: User }>('autentico_refresh');
                if (!cancelled && refreshed?.user) {
                    setUser(refreshed.user);
                    setAuthState('authenticated');
                    return;
                }
            } catch {
                // Refresh failed (expired, revoked, or offline). Fall through.
            }

            if (!cancelled) setAuthState('unauthenticated');
        }

        boot();
        return () => { cancelled = true; };
    }, []);

    // Periodic validate every 6 hours while authenticated. Failure is silent (DEC-058).
    // 05b will act on suspended/revoked status. 05a just proves the loop works.
    useEffect(() => {
        if (authState !== 'authenticated') return;
        const interval = setInterval(async () => {
            try {
                await invoke('autentico_validate');
            } catch {
                // Offline. Silent. Do not log out per DEC-058.
            }
        }, 6 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [authState]);

    const login = async (username: string, password: string) => {
        const r = await invoke<{ token: string; user: User }>('autentico_login', { username, password });
        setUser(r.user);
        setAuthState('authenticated');
    };

    const logout = async () => {
        if (user) {
            try {
                await invoke('stop_sync_for_user', { userPath: user.path });
            } catch (err) {
                console.error('Failed to stop sync on logout:', err);
            }
        }
        await invoke('autentico_logout').catch(() => {});
        setUser(null);
        setAuthState('unauthenticated');
    };

    return (
        <AuthContext.Provider value={{ user, authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}