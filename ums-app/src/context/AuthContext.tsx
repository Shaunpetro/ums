// Path: ums-app/src/context/AuthContext.tsx
// Purpose: Mock Authentication context with extended roles and capabilities.

import { createContext, useContext, useState, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface User {
    id: string;
    name: string;
    role: string;
    org: string;       // The currently active company
    orgs: string[];    // All companies the user belongs to
    dept: string;
    path: string;
    email: string;
    capabilities: string[];
}

export const MOCK_USERS: User[] = [
    { 
        id: 'shadrack', name: 'Shadrack', role: 'CEO', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Executive', path: 'VSC Mining/Executive/Shadrack', 
        email: 'shadrack@vscmining.co.za', capabilities: ['read:all', 'write:all', 'admin:profile', 'admin:finance'] 
    },
    { 
        id: 'palesa', name: 'Palesa', role: 'PA to CEO', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Executive', path: 'VSC Mining/Executive/Palesa', 
        email: 'info@vscmining.co.za', capabilities: ['read:executive', 'write:executive', 'read:finance', 'write:finance', 'read:tenders', 'write:tenders'] 
    },
    { 
        id: 'hector', name: 'Hector', role: 'Project Manager', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Management', path: 'VSC Mining/Management/Hector', 
        email: 'bouwerh@vscmining.co.za', capabilities: ['read:all', 'write:management', 'admin:profile'] 
    },
    { 
        id: 'edward', name: 'Edward', role: 'Technical Manager', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Management', path: 'VSC Mining/Management/Edward', 
        email: 'e.holden-smith@vscmining.co.za', capabilities: ['read:management', 'write:management', 'read:devops'] 
    },
    { 
        id: 'marshall', name: 'Marshall', role: 'Finance Admin', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Finance', path: 'VSC Mining/Finance/Marshall', 
        email: 'marshall.makina@vscmining.co.za', capabilities: ['read:finance', 'write:finance', 'read:management', 'write:management', 'read:executive', 'write:executive', 'admin:profile', 'admin:finance'] 
    },
    { 
        id: 'angela', name: 'Angela', role: 'Accountant', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'Finance', path: 'VSC Mining/Finance/Angela', 
        email: 'a.leboa@vscmining.co.za', capabilities: ['read:finance', 'write:finance', 'admin:finance'] 
    },
    { 
        id: 'thapelo', name: 'Thapelo', role: 'HR', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'HR', path: 'VSC Mining/HR/Thapelo', 
        email: 'dikobe.t@vscmining.co.za', capabilities: ['read:hr', 'write:hr'] 
    },
    { 
        id: 'petro', name: 'Petro', role: 'DevOps', org: 'VSC Mining', orgs: ['VSC Mining'], dept: 'DevOps', path: 'VSC Mining/DevOps/Petro', 
        email: 'petro@vscmining.co.za', capabilities: ['read:all', 'write:all', 'admin:profile', 'admin:finance'] 
    },
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