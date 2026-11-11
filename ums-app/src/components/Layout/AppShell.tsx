// Path: ums-app/src/components/Layout/AppShell.tsx
// Purpose: Main layout with company switcher dropdown, dynamic footer, and tray-aware UI.

import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, HardDrive, FileText, Receipt, Briefcase, CheckSquare, HelpCircle, Sun, Moon, Building2, LogOut, Activity, RefreshCw, ChevronDown, Settings, Plus, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { listen } from '@tauri-apps/api/event';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SyncSetupModal from './SyncSetupModal';
import FileLuSetupModal from './FileLuSetupModal';
import HelpModal from './HelpModal';
import CompanyProfile from '../Company/CompanyProfile';
import AddCompanyModal from '../Company/AddCompanyModal';
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
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('ums-theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    
    // Dropdown State
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [appVersion, setAppVersion] = useState('');
    const [credChecked, setCredChecked] = useState(false);
    const [credsSet, setCredsSet] = useState(false);
    const [syncChecked, setSyncChecked] = useState(false);
    const [syncReady, setSyncReady] = useState(false);
    const [syncConfig, setSyncConfig] = useState<any>(null);
    
    // Centralized Connection State
    const [storageUsed, setStorageUsed] = useState<number>(0);
    const [isConnected, setIsConnected] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Pending Queue State
    const [pendingCount, setPendingCount] = useState(0);
    const [isFlushing, setIsFlushing] = useState(false);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCompanyDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Route persistence
    useEffect(() => {
        localStorage.setItem('ums-last-route', location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const savedRoute = localStorage.getItem('ums-last-route');
        if (savedRoute && savedRoute !== '/' && location.pathname === '/') {
            navigate(savedRoute, { replace: true });
        }
    }, []);

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

    // Listen for Sync Status updates
    useEffect(() => {
        const unlisten = listen<any>('sync-status', (event) => {
            const { status, message } = event.payload;
            if (status === 'pending') {
                setPendingCount(prev => prev + 1);
            } else if (status === 'flushing') {
                setIsFlushing(true);
            } else if (status === 'success' && message) {
                setPendingCount(0);
                setIsFlushing(false);
                toast(message, 'success');
            }
        });
        return () => { unlisten.then(f => f()); };
    }, [toast]);

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

    // Heartbeat Connection Check (Runs every 1 hour)
    useEffect(() => {
        if (!credsSet) return;
        
        const checkConnection = () => {
            invoke<number>('get_storage_usage')
                .then((bytes) => {
                    setStorageUsed(bytes);
                    setIsConnected(true);
                    setApiError(null); 
                })
                .catch((err) => {
                    console.error("Storage usage check failed:", err);
                    let errorMsg = "Connection failed.";
                    if (err.includes("AccessDenied") || err.includes("limit exceeded")) {
                        errorMsg = "FileLu API limit exceeded.";
                    } else if (err.includes("dispatch failure") || err.includes("network")) {
                        errorMsg = "Network error. Check your internet.";
                    }
                    setIsConnected(false);
                    setApiError(errorMsg);
                });
        };

        checkConnection();
        const interval = setInterval(checkConnection, 3600000); 
        return () => clearInterval(interval);
    }, [credsSet]);

    const reportCloudStatus = (success: boolean, errorMsg?: string) => {
        if (success) {
            setIsConnected(true);
            setApiError(null);
        } else {
            setIsConnected(false);
            if (errorMsg) setApiError(errorMsg);
        }
    };

    const handleManualSync = async () => {
        setIsFlushing(true);
        try {
            await invoke('flush_pending_uploads');
        } catch (err) {
            toast(`Manual sync failed: ${err}`, 'error');
            setIsFlushing(false);
        }
    };

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
    const lastUpdated = new Date().toLocaleDateString();
    const finalConnectedState = credsSet && isConnected;
    const isFullySyncing = syncReady && finalConnectedState && !isFlushing;
    const canEditCompany = user.capabilities.includes('admin:profile') || user.capabilities.includes('admin:finance');

    return (
        <div className="app-container">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

            {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
            {isCompanyOpen && <CompanyProfile onClose={() => setIsCompanyOpen(false)} />}
            {isAddCompanyOpen && <AddCompanyModal onClose={() => setIsAddCompanyOpen(false)} />}

            {(!credsSet) && (
                <FileLuSetupModal
                    onComplete={() => {
                        setCredsSet(true);
                        setIsConnected(true);
                        setApiError(null);
                    }}
                    onLogout={logout}
                />
            )}

            {credsSet && isCredModalOpen && (
                <FileLuSetupModal
                    onComplete={() => {
                        setIsConnected(true);
                        setApiError(null);
                        setIsCredModalOpen(false);
                    }}
                    onClose={() => setIsCredModalOpen(false)}
                    apiError={apiError}
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
                    <img 
                        src="/logo-horizontal-white.svg" 
                        alt="Ubuveil" 
                        style={{ height: '32px', marginRight: '12px' }} 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                const text = document.createElement('span');
                                text.innerText = 'UBUVEIL';
                                text.className = 'brand-title';
                                parent.appendChild(text);
                            }
                        }}
                    />
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
                    <button 
                        className="text-btn" 
                        onClick={() => setIsCredModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '12px', width: '100%', justifyContent: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Click to reconnect or change keys"
                    >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: finalConnectedState ? 'var(--ubv-success)' : 'var(--ubv-danger)' }}></div>
                        <span className="marker" style={{ fontSize: '12px', fontWeight: 600, color: finalConnectedState ? 'var(--ubv-text-main)' : 'var(--ubv-danger)' }}>
                            FileLu {finalConnectedState ? 'Connected' : 'Disconnected'}
                        </span>
                        <span className="marker" style={{ fontSize: '11px', color: 'var(--ubv-warning)', marginLeft: 'auto', paddingRight: '12px' }}>
                            {isFlushing ? 'Syncing...' : pendingCount > 0 ? `${pendingCount} pending` : 'Synced'}
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
                        
                        {/* COMPANY SWITCHER DROPDOWN */}
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button 
                                className="text-btn" 
                                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: isCompanyDropdownOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid var(--ubv-border)' }}
                            >
                                <Building2 size={16} color="var(--ubv-brand-gradient-start)" />
                                <span className="marker" style={{ fontWeight: 700 }}>[{user.org.toUpperCase()}]</span>
                                <ChevronDown size={14} color="var(--ubv-text-muted)" />
                            </button>

                            {isCompanyDropdownOpen && (
                                <div className="glass-panel" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '240px', zIndex: 1000, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--ubv-bg-elevated)' }}>
                                    
                                    {/* Active Company */}
                                    <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--ubv-text-muted)', borderBottom: '1px solid var(--ubv-border)', marginBottom: '4px' }}>
                                        YOUR WORKSPACES
                                    </div>
                                    
                                    {user.orgs.map(org => (
                                        <button 
                                            key={org}
                                            className="text-btn" 
                                            onClick={() => {
                                                if (org !== user.org) toast('Multi-company switching requires Autentico (Coming Soon)', 'info');
                                                setIsCompanyDropdownOpen(false);
                                            }}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '4px', background: org === user.org ? 'rgba(128,128,128,0.1)' : 'transparent', width: '100%' }}
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: org === user.org ? 600 : 400 }}>{org}</span>
                                            {org === user.org && <Check size={14} color="var(--ubv-success)" />}
                                        </button>
                                    ))}

                                    <div style={{ height: '1px', background: 'var(--ubv-border)', margin: '4px 0' }} />

                                    {/* Actions */}
                                    <button className="text-btn" onClick={() => { setIsAddCompanyOpen(true); setIsCompanyDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px', width: '100%' }}>
                                        <Plus size={14} /> Add Workspace
                                    </button>

                                    {canEditCompany && (
                                        <button className="text-btn" onClick={() => { setIsCompanyOpen(true); setIsCompanyDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px', width: '100%' }}>
                                            <Settings size={14} /> Company Settings
                                        </button>
                                    )}

                                </div>
                            )}
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
                    <Outlet context={{ syncConfig, user, reportCloudStatus }} />
                </div>

                <footer style={{ padding: '12px 32px', borderTop: '1px solid var(--ubv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--ubv-text-muted)', background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                        Ubuveil MS (c) ARR
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button className="text-btn" onClick={handleManualSync} disabled={isFlushing || pendingCount === 0} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: pendingCount > 0 ? 'var(--ubv-warning)' : 'var(--ubv-text-muted)' }}>
                            <RefreshCw size={10} className={isFlushing ? 'spin' : ''} />
                            Sync Now
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={12} color={isFullySyncing ? 'var(--ubv-success)' : 'var(--ubv-warning)'} />
                            {isFullySyncing ? 'Sync Active' : 'Sync Paused'}
                        </div>
                        <span>v{appVersion} | Last Updated: {lastUpdated}</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}