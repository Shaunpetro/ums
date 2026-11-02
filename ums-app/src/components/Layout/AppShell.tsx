// Path: ums-app/src/components/Layout/AppShell.tsx
// Purpose: Main layout wrapper with dynamic live storage count and multi-user config checks.

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardDrive, FileText, Receipt, Briefcase, CheckSquare, HelpCircle, Sun, Moon, Building2, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../../context/AuthContext';
import SyncSetupModal from './SyncSetupModal';
import './AppShell.css';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/storage', label: 'Storage Drive', icon: <HardDrive size={18} /> },
    { path: '/clients', label: 'Clients & CRM', icon: <Building2 size={18} /> },
    { path: '/tenders', label: 'Tenders', icon: <FileText size={18} /> },
    { path: '/invoices', label: 'Invoices', icon: <Receipt size={18} /> },
    { path: '/projects', label: 'Projects', icon: <Briefcase size={18} /> },
    { path: '/tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
];

export default function AppShell() {
    const { user, logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('ums-theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    
    const [syncConfig, setSyncConfig] = useState<any>(null);
    const [checkingConfig, setCheckingConfig] = useState(true);
    const [storageUsed, setStorageUsed] = useState<number>(0);
    
    const location = useLocation();

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('ums-theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('ums-theme', 'light');
        }
    }, [isDarkMode]);

    // Fetch Configs (Multi-User)
    useEffect(() => {
        if (!user) return;
        invoke<any[]>('get_all_sync_configs')
            .then((configs) => {
                // Find the config that belongs to the currently logged in user
                const userConfig = configs.find(c => c.sync_target_prefix === `${user.path}/`);
                if (userConfig) {
                    setSyncConfig(userConfig);
                } else {
                    setSyncConfig(null);
                }
                setCheckingConfig(false);
            })
            .catch(() => setCheckingConfig(false));
    }, [user]);

    // Fetch Storage Usage
    useEffect(() => {
        const fetchUsage = () => {
            invoke<number>('get_storage_usage')
                .then((bytes) => setStorageUsed(bytes))
                .catch(console.error);
        };

        fetchUsage();
        const interval = setInterval(fetchUsage, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getSearchPlaceholder = () => {
        const current = NAV_ITEMS.find(item => item.path === location.pathname);
        return current ? `Search in ${current.label}...` : 'Search all pipelines...';
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!user) return null;
    if (checkingConfig) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ubv-bg-primary)' }}>Loading UMS...</div>;

    const quotaPercentage = Math.min((storageUsed / (100 * 1024 * 1024 * 1024)) * 100, 100);

    return (
        <div className="app-container">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

            {!syncConfig && (
                <SyncSetupModal 
                    userPath={user.path} 
                    onComplete={(path, prefix) => setSyncConfig({ local_path: path, sync_target_prefix: prefix })} 
                />
            )}

            <aside className="sidebar glass-panel">
                <div className="brand">
                    <div className="logo-circle"></div>
                    <div className="brand-text-group">
                        <span className="brand-title">Ubuveil</span>
                        <span className="brand-subtitle">Management System</span>
                    </div>
                </div>

                <button className="new-btn">
                    + New Upload
                </button>

                <nav className="nav-menu">
                    {NAV_ITEMS.map((item) => (
                        <NavLink 
                            key={item.path} 
                            to={item.path} 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="storage-quota">
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                            <span className="marker" style={{ fontSize: '11px' }}>Storage</span>
                            <span className="marker" style={{ fontSize: '11px' }}>{formatSize(storageUsed)} / 100 GB</span>
                        </div>
                        <div className="quota-bar">
                            <div className="quota-fill" style={{ width: `${quotaPercentage}%` }}></div>
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-profile">
                            <div className="avatar-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ubv-brand-gradient)' }}>
                                <span style={{ color: 'white', fontWeight: 600 }}>{user.name.charAt(0)}</span>
                            </div>
                            <div className="user-info" style={{ flex: 1 }}>
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                            <button className="icon-btn" onClick={logout} title="Log out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar glass-panel">
                    <div className="search-bar">
                        <input type="text" placeholder={getSearchPlaceholder()} className="search-input" />
                    </div>
                    <div className="topbar-actions">
                        <div className="company-brand">
                            <span className="marker" style={{ fontWeight: 700 }}>[{user.org.toUpperCase()}]</span>
                        </div>
                        
                        <button className="icon-btn"><HelpCircle size={20} /></button>
                        <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet context={{ syncConfig, user }} />
                </div>
            </main>
        </div>
    );
}