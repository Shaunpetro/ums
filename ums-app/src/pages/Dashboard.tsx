// Path: ums-app/src/pages/Dashboard.tsx
// Purpose: Dynamic Dashboard pulling the 3 most recent files and displaying them prominently.

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useOutletContext, Link } from 'react-router-dom';
import { FileText, Clock, Settings, FileSpreadsheet, FileImage, FileArchive, ArrowRight } from 'lucide-react';

interface S3Object {
    key: string;
    size: number;
    is_folder: boolean;
    last_modified: string | null;
}

export default function Dashboard() {
    const { user } = useOutletContext<any>();
    const [recentFiles, setRecentFiles] = useState<S3Object[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        invoke<S3Object[]>('list_files', { prefix: `${user.path}/` })
            .then((data) => {
                const filesOnly = data
                    .filter(f => !f.is_folder && f.last_modified)
                    .sort((a, b) => new Date(b.last_modified!).getTime() - new Date(a.last_modified!).getTime())
                    .slice(0, 3); 
                
                setRecentFiles(filesOnly);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch recent files:", err);
                setLoading(false);
            });
    }, [user]);

    const getFileVisuals = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['pdf'].includes(ext)) return { icon: <FileText size={32} />, color: '#EB6F65' };
        if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return { icon: <FileText size={32} />, color: '#4B9CD3' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: <FileSpreadsheet size={32} />, color: '#2BB673' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: <FileArchive size={32} />, color: '#F5AB82' };
        if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return { icon: <FileImage size={32} />, color: '#9B59B6' };
        return { icon: <FileText size={32} />, color: 'var(--ubv-text-muted)' };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="dashboard-page">
            <div className="page-header flex-between" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>
                        Welcome back, {user.name}
                    </h1>
                    <p className="marker">Here is your overview for {user.dept} at {user.org}.</p>
                </div>
                <button className="action-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={16} /> Customize Layout
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* REAL Recent Files Widget - Exactly 3 Files */}
                <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '24px' }}>
                    <div className="flex-between" style={{ borderBottom: '1px solid var(--ubv-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={20} /> Your Recent Uploads
                        </h3>
                        <Link to="/storage" className="text-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {loading ? (
                            <div className="marker" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>Fetching your files...</div>
                        ) : recentFiles.length === 0 ? (
                            <div className="marker" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>You haven't uploaded any files yet.</div>
                        ) : (
                            recentFiles.map(file => {
                                const visuals = getFileVisuals(file.key);
                                const fileName = file.key.split('/').pop();
                                return (
                                    <div key={file.key} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(128,128,128,0.03)' }}>
                                        <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                                                {fileName}
                                            </div>
                                            <div className="marker" style={{ fontSize: '12px' }}>
                                                {formatDate(file.last_modified!)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Active Tenders Widget (Mocked for now) */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                        Active Tenders
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(128,128,128,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>North Shaft Expansion</div>
                                <div className="marker" style={{ fontSize: '11px' }}>Due: 3 days</div>
                            </div>
                            <span className="badge warning">Drafting</span>
                        </div>
                    </div>
                </div>

                {/* Invoice Tracker Widget (Mocked for now) */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                        Invoice Tracker
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(128,128,128,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>INV-2026-089</div>
                                <div className="marker" style={{ fontSize: '11px' }}>R 45,000.00</div>
                            </div>
                            <span className="badge danger">Unsent</span>
                        </div>
                    </div>
                </div>

                {/* My Tasks Widget (Mocked for now) */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                        My Tasks
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(128,128,128,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>Review Tender Docs</div>
                                <div className="marker" style={{ fontSize: '11px' }}>Assigned to {user.name}</div>
                            </div>
                            <span className="badge danger">Today</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}