// Path: ums-app/src/components/Layout/AppShell.tsx
// Purpose: Main layout wrapper containing Sidebar, Topbar, and content outlet with persistent theme toggling.

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardDrive, FileText, Receipt, Briefcase, CheckSquare, HelpCircle, Sun, Moon, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('ums-theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    
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

    const getSearchPlaceholder = () => {
        const current = NAV_ITEMS.find(item => item.path === location.pathname);
        return current ? `Search in ${current.label}...` : 'Search all pipelines...';
    };

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        // If clicking the link for the page we are already on, force a reset
        if (location.pathname === path && path === '/storage') {
            window.dispatchEvent(new Event('reset-storage-home'));
        }
    };

    return (
        <div className="app-container">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

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
                            onClick={(e) => handleNavClick(e, item.path)}
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
                            <span className="marker" style={{ fontSize: '11px' }}>35 GB / 100 GB</span>
                        </div>
                        <div className="quota-bar">
                            <div className="quota-fill" style={{ width: '35%' }}></div>
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-profile">
                            <div className="avatar-circle"></div>
                            <div className="user-info">
                                <span className="user-name">Petro Malamule</span>
                                <span className="user-role">Super User</span>
                            </div>
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
                            <span className="marker" style={{ fontWeight: 700 }}>[VSC MINING]</span>
                        </div>
                        
                        <button className="icon-btn"><HelpCircle size={20} /></button>
                        <button className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}