// Path: ums-app/src/components/Layout/AppShell.tsx
// Purpose: Main layout with dynamic footer, tray-aware UI, and clickable FileLu status.

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardDrive, FileText, Receipt, Briefcase, CheckSquare, HelpCircle, Sun, Moon, Building2, LogOut, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { useAuth } from '../../context/AuthContext';
import SyncSetupModal from './SyncSetupModal';
import FileLuSetupModal from './FileLuSetupModal';
import HelpModal from './HelpModal';
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

    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [appVersion, setAppVersion] = useState('');
    const [credChecked, setCredChecked] = useState(false);
    const [credsSet, setCredsSet] = useState(false);
    const [syncChecked, setSyncChecked] = useState(false);
    const [syncReady, setSyncReady] = useState(false);
    const [syncConfig, setSyncConfig] = useState<any>(null);
    
    // Connection status
    const [storageUsed, setStorageUsed] = useState<number>(0);
    const [apiError, setApiError] = useState<string | null>(null);

    const location = useLocation();

    useEffect(() => {
        getVersion().then(setAppVersion);
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('ums-theme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('ums-theme', 'light');
        }
    }, [isDarkMode]);

    // Check FileLu credentials
    useEffect(() => {
        if (!user) return;
        setCredChecked(false);
        invoke<{ all_set: boolean }>('get_filelu_credentials_status')
            .then(status => {
                setCredsSet(status.all_set);
                setCredChecked(true);
            })
            .catch(err => {
                console.error('Failed to check FileLu credentials:', err);
                setCredsSet(false);
                setCredChecked(true);
            });
    }, [user]);

    // Per-user sync lifecycle
    useEffect(() => {
        if (!user || !credsSet) return;
        setSyncChecked(false);
        invoke<any[]>('get_all_sync_configs')
            .then(configs => {
                const cfg = configs.find(c => c.sync_target_prefix === `${user.path}/`);
                if (cfg) {
                    setSyncConfig(cfg);
                    invoke<boolean>('start_sync_for_user', { userPath: user.path })
                        .then(started => {
                            setSyncReady(started);
                            setSyncChecked(true);
                        })
                        .catch(err => {
                            console.error('Failed to start sync:', err);
                            setSyncReady(false);
                            setSyncChecked(true);
                        });
                } else {
                    setSyncConfig(null);
                    setSyncReady(false);
                    setSyncChecked(true);
                }
            })
            .catch(err => {
                console.error('Failed to load sync configs:', err);
                setSyncReady(false);
                setSyncChecked(true);
            });
    }, [user, credsSet]);

    // Fetch Storage Usage (Every 1 hour to save API calls)
    useEffect(() => {
        if (!credsSet) return;
        const fetchUsage = () => {
            invoke<number>('get_storage_usage')
                .then((bytes) => {
                    setStorageUsed(bytes);
                    setApiError(null); // Connected successfully
                })
                .catch((err) => {
                    console.error("Storage usage check failed:", err);
                    if (err.includes("AccessDenied") || err.includes("limit exceeded")) {
                        setApiError("FileLu API limit exceeded.");
                    } else {
                        setApiError("Connection failed.");
                    }
                });
        };

        fetchUsage(); // Fetch immediately on load
        const interval = setInterval(fetchUsage, 3600000); // 1 hour = 3,600,000 ms
        return () => clearInterval(interval);
    }, [credsSet]);

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

    if (!credChecked) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ubv-bg-primary)' }}>Loading UMS...</div>;
    }

    const quotaPercentage = Math.min((storageUsed / (100 * 1024 * 1024 * 1024)) * 100, 100);
    const lastUpdated = new Date().toLocaleDateString(); // Placeholder for dynamic exe timestamp

    const isConnected = credsSet && !apiError;

    return (
        <div className="app-container">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

            {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}

            {(!credsSet || isCredModalOpen) && (
                <FileLuSetupModal
                    onComplete={() => {
                        setCredsSet(true);
                        setIsCredModalOpen(false);
                    }}
                    onLogout={!credsSet ? logout : undefined}
                    onClose={!credsSet ? undefined : () => setIsCredModalOpen(false)}
                />
            )}

            {credsSet && syncChecked && !syncReady && !isCredModalOpen && (
                <SyncSetupModal
                    userPath={user.path}
                    onComplete={(path, prefix) => {
                        setSyncConfig({ local_path: path, sync_target_prefix: prefix });
                        setSyncReady(true);
                    }}
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
                    {/* FileLu Status - Clickable */}
                    <button 
                        className="text-btn" 
                        onClick={() => setIsCredModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '12px', width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Click to reconnect or change keys"
                    >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? 'var(--ubv-success)' : 'var(--ubv-danger)' }}></div>
                        <span className="marker" style={{ fontSize: '12px', fontWeight: 600, color: isConnected ? 'var(--ubv-text-main)' : 'var(--ubv-danger)' }}>
                            FileLu {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </button>

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
                            <button className="icon-btn" onClick={() => { void logout(); }} title="Log out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
                <header className="topbar glass-panel">
                    <div className="search-bar">
                        <input type="text" placeholder={getSearchPlaceholder()} className="search-input" />
                    </div>
                    <div className="topbar-actions">
                        <div className="company-brand">
                            <span className="marker" style={{ fontWeight: 700 }}>[{user.org.toUpperCase()}]</span>
                        </div>

                        <button className="icon-btn" onClick={() => setIsHelpOpen(true)} title="Help & Support">
                            <HelpCircle size={20} />
                        </button>
                        <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet context={{ syncConfig, user }} />
                </div>

                {/* Footer */}
                <footer style={{ padding: '12px 32px', borderTop: '1px solid var(--ubv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--ubv-text-muted)', background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                        Ubuveil MS (c) ARR
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={12} color={syncReady ? 'var(--ubv-success)' : 'var(--ubv-warning)'} />
                            {syncReady ? 'Sync Active' : 'Sync Paused'}
                        </div>
                        <span>v{appVersion} | Last Updated: {lastUpdated}</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}