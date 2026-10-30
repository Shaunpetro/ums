// Path: src/types/index.ts
// Purpose: Centralized TypeScript interfaces for UMS.

export type UserRole = 'SUPER_USER' | 'ADMIN' | 'USER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}

export interface Department {
    id: string;
    name: string;
    icon: string;
    storageUsed: string;
}

export interface Site {
    id: string;
    name: string;
}

export interface FileItem {
    id: string;
    name: string;
    type: 'pdf' | 'xls' | 'doc' | 'folder';
    size: string;
    syncStatus: 'synced' | 'syncing' | 'offline';
    modifiedAt: string;
}