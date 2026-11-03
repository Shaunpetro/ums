// Path: ums-app/src/context/AuthContext.tsx
// Purpose: Mock Authentication context for user selection and tenant mapping with sync lifecycle hooks.

import { createContext, useContext, useState, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface User {
    id: string;
    name: string;
    role: string;
    org: string;
    dept: string;
    path: string;
}

// Hardcoded users for the mock Auth phase
export const MOCK_USERS: User[] = [
    { id: 'shadrack', name: 'Shadrack', role: 'CEO', org: 'VSC Mining', dept: 'Executive', path: 'VSC Mining/Executive/Shadrack' },
    { id: 'hector', name: 'Hector', role: 'Project Management', org: 'VSC Mining', dept: 'Project Management', path: 'VSC Mining/Project Management/Hector' },
    { id: 'edward', name: 'Edward', role: 'Technical Management', org: 'VSC Mining', dept: 'Technical Management', path: 'VSC Mining/Technical Management/Edward' },
    { id: 'petro', name: 'Petro', role: 'DevOps', org: 'VSC Mining', dept: 'DevOps', path: 'VSC Mining/DevOps/Petro' },
    { id: 'palesa', name: 'Palesa', role: 'Reception', org: 'VSC Mining', dept: 'Reception', path: 'VSC Mining/Reception/Palesa' },
];

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('ums-current-user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (selectedUser: User) => {
        setUser(selectedUser);
        localStorage.setItem('ums-current-user', JSON.stringify(selectedUser));
    };

    const logout = async () => {
        if (user) {
            try {
                await invoke('stop_sync_for_user', { userPath: user.path });
            } catch (err) {
                console.error('Failed to stop sync on logout:', err);
            }
        }
        setUser(null);
        localStorage.removeItem('ums-current-user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}