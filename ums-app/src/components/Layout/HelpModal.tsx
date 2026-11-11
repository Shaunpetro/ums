// Path: ums-app/src/components/Layout/HelpModal.tsx
// Purpose: Help, IT Support, About, and Debug tools.

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { appLogDir } from '@tauri-apps/api/path';
import { openPath } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { X, RefreshCw, MessageCircle, Bug, FolderOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Props {
    onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'about' | 'support'>('about');
    const [appVersion, setAppVersion] = useState('...');
    const [tauriVersion, setTauriVersion] = useState('...');
    const [checking, setChecking] = useState(false);
    
    const [issue, setIssue] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        getVersion().then(setAppVersion);
        getTauriVersion().then(setTauriVersion);
    }, []);

    const handleCheckUpdates = async () => {
        setChecking(true);
        try {
            const update = await check();
            if (update) {
                toast(`Update found: v${update.version}. Downloading...`, 'info');
                await update.downloadAndInstall();
            } else {
                toast('You are on the latest version.', 'success');
            }
        } catch (err) {
            toast(`Update error: ${err}`, 'error');
        } finally {
            setChecking(false);
        }
    };

    const handleOpenLogs = async () => {
        try {
            const logDir = await appLogDir();
            await openPath(logDir);
        } catch (err) {
            toast(`Could not open logs folder: ${err}`, 'error');
        }
    };

    const handleToggleDevTools = async () => {
        try {
            await invoke('open_devtools');
        } catch (err) {
            toast(`Could not open DevTools: ${err}`, 'error');
        }
    };

    const handlePingIT = async () => {
        if (!issue.trim()) {
            toast('Please describe the issue first.', 'error');
            return;
        }
        if (!user) return;

        setSending(true);
        try {
            await invoke('send_it_alert', {
                userName: user.name,
                userOrg: user.org,
                userDept: user.dept,
                issue: issue.trim()
            });
            toast('Alert sent to IT successfully.', 'success');
            setIssue('');
            onClose();
        } catch (err) {
            toast(`Failed to send alert: ${err}`, 'error');
        } finally {
            setSending(false);
        }
    };

    const whatsappLink = "https://wa.me/27813877744?text=Hi%20Petro,%20I%20need%20help%20with%20Ubuveil%20MS.";

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.9)', backdropFilter: 'blur(10px)' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', minHeight: '450px', display: 'flex', flexDirection: 'column', border: '1px solid var(--ubv-brand-gradient-start)' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Help & Support</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--ubv-border)', marginBottom: '24px' }}>
                    <button className={`text-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'about' ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: activeTab === 'about' ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}>About</button>
                    <button className={`text-btn ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'support' ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: activeTab === 'support' ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}>IT Support</button>
                </div>

                {activeTab === 'about' ? (
                    <div style={{ flex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--ubv-brand-gradient)', marginBottom: '16px' }}>
                                <span style={{ color: 'white', fontWeight: 700, fontSize: '24px' }}>U</span>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Ubuveil Management System</h3>
                            <p className="marker">Version {appVersion} | Tauri {tauriVersion}</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)', marginBottom: '16px' }}>
                            <div className="flex-between">
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Application Updates</span>
                                <button className="outline-btn" onClick={handleCheckUpdates} disabled={checking} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <RefreshCw size={12} className={checking ? 'spin' : ''} style={{ marginRight: '6px' }} />
                                    Check
                                </button>
                            </div>
                        </div>

                        {/* Debug Tools */}
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Bug size={16} color="var(--ubv-brand-gradient-start)" />
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Debug Tools</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="outline-btn" onClick={handleOpenLogs} style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <FolderOpen size={14} /> Open Logs
                                </button>
                                <button className="outline-btn" onClick={handleToggleDevTools} style={{ flex: 1, padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Bug size={14} /> DevTools (F12)
                                </button>
                            </div>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--ubv-text-muted)', lineHeight: '1.8' }}>
                            <p><strong>Developer:</strong> <a href={whatsappLink} target="_blank" rel="noreferrer" style={{ color: 'var(--ubv-brand-gradient-start)' }}>Petro@ATG</a></p>
                            <p><strong>Company:</strong> ATG DesEng (Pty) Ltd</p>
                            <p><strong>Licenses:</strong> Tauri (MIT), React (MIT), AWS SDK (Apache 2.0), Lucide Icons (ISC), FileLu (S3).</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p className="marker" style={{ marginBottom: '16px' }}>
                            Experiencing an issue? Send an alert to Petro (IT). Your name, department, and app version will be attached.
                        </p>
                        
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Describe the issue</label>
                            <textarea 
                                className="form-input" 
                                style={{ height: '120px', resize: 'none' }}
                                value={issue}
                                onChange={e => setIssue(e.target.value)}
                                placeholder="e.g., My files are not syncing to the cloud."
                                disabled={sending}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button className="action-btn" style={{ flex: 1 }} onClick={handlePingIT} disabled={sending}>
                                {sending ? 'Sending...' : 'Ping IT Support'}
                            </button>
                            <a href={whatsappLink} target="_blank" rel="noreferrer" className="outline-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}