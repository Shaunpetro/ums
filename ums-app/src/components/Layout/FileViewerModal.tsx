// Path: ums-app/src/components/Layout/FileViewerModal.tsx
// Purpose: Full-screen file viewer. Tier 1 (local sync), Tier 2 (cache), Tier 3 (cloud).

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../context/ToastContext';
import { X, Loader2, FileText, ExternalLink, AlertTriangle, HardDrive, Cloud, RefreshCw } from 'lucide-react';

interface Props {
    fileKey: string;
    fileName: string;
    lastModified: string | null;
    onClose: () => void;
    localRoot: string | null;
    userPath: string;
}

export default function FileViewerModal({ fileKey, fileName, lastModified, onClose, localRoot, userPath }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<string | null>(null);
    const [type, setType] = useState<'image' | 'pdf' | 'text' | 'unsupported' | 'error' | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [source, setSource] = useState<'local' | 'cache' | 'cloud' | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
    const isPdf = ext === 'pdf';
    const isText = ['txt', 'csv', 'json', 'md', 'log', 'xml', 'html', 'css', 'js', 'ts', 'rs', 'yml', 'yaml'].includes(ext);
    const isSupported = isImage || isPdf || isText;

    const isOwnFile = fileKey.startsWith(`${userPath}/`);

    const renderContent = (b64: string, src: 'local' | 'cache' | 'cloud') => {
        setSource(src);
        if (isImage) {
            const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
            setContent(`data:image/${mime};base64,${b64}`);
            setType('image');
        } else if (isPdf) {
            setContent(b64);
            setType('pdf');
        } else {
            try {
                const binary = window.atob(b64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                setContent(new TextDecoder('utf-8').decode(bytes));
                setType('text');
            } catch {
                setContent("Failed to decode text file.");
                setType('text');
            }
        }
    };

    const loadFile = useCallback(async (forceRefresh: boolean = false) => {
        setLoading(true);
        setErrorMsg(null);

        if (isOwnFile && localRoot) {
            try {
                const b64 = await invoke<string>('read_local_file_as_base64', {
                    localRoot,
                    s3Key: fileKey,
                    userPath,
                });
                renderContent(b64, 'local');
                setLoading(false);
                return;
            } catch (e) {
                console.log("Local read failed:", e);
            }
        }

        try {
            const b64 = await invoke<string>('cache_file_from_cloud', {
                s3Key: fileKey,
                lastModified: lastModified || '',
                forceRefresh,
            });
            renderContent(b64, forceRefresh ? 'cloud' : 'cache');
            setLoading(false);
        } catch (cloudErr) {
            setErrorMsg(String(cloudErr));
            setType('error');
            setLoading(false);
        }
    }, [fileKey, localRoot, userPath, lastModified, isOwnFile]);

    useEffect(() => {
        if (!isSupported) {
            setType('unsupported');
            setLoading(false);
            return;
        }
        loadFile(false);
    }, [loadFile, isSupported]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadFile(true);
        setRefreshing(false);
        toast('Refreshed from cloud.', 'success');
    };

    const handleOpenNatively = async () => {
        setDownloading(true);
        try {
            await invoke('open_file_natively', {
                s3Key: fileKey,
                localRoot: localRoot,
                userPath: userPath,
                lastModified: lastModified || ''
            });
            toast(`Opening file in default app...`, 'success');
            onClose();
        } catch (err) {
            toast(`Failed to open file: ${err}`, 'error');
        } finally {
            setDownloading(false);
        }
    };

    const sourceBadge = source === 'local' ? { icon: <HardDrive size={12} />, label: 'Local', color: 'var(--ubv-success)' }
        : source === 'cache' ? { icon: <HardDrive size={12} />, label: 'Cached', color: 'var(--ubv-brand-gradient-start)' }
        : source === 'cloud' ? { icon: <Cloud size={12} />, label: 'Cloud', color: 'var(--ubv-warning)' }
        : null;

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(10, 10, 12, 0.95)', backdropFilter: 'blur(20px)' }}>
            <div 
                style={{ 
                    width: '95vw', height: '95vh', display: 'flex', flexDirection: 'column', 
                    background: '#121216', borderRadius: '12px', border: '1px solid var(--ubv-border)', 
                    overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' 
                }} 
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ubv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</h2>
                        {sourceBadge && (
                            <span style={{ fontSize: '11px', background: 'rgba(128,128,128,0.15)', color: sourceBadge.color, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {sourceBadge.icon} {sourceBadge.label}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isSupported && source !== 'local' && (
                            <button className="icon-btn" onClick={handleRefresh} disabled={refreshing} title="Re-download from cloud">
                                <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                            </button>
                        )}
                        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0a0c', position: 'relative' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <Loader2 size={48} className="spin" color="var(--ubv-brand-gradient-start)" />
                            <span className="marker" style={{ fontSize: '16px' }}>Loading file...</span>
                        </div>
                    ) : type === 'error' ? (
                        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--ubv-bg-elevated)', borderRadius: '12px', border: '1px solid var(--ubv-danger)' }}>
                            <AlertTriangle size={64} color="var(--ubv-danger)" style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--ubv-danger)' }}>Cannot Load File</h3>
                            <p className="marker" style={{ marginBottom: '24px', maxWidth: '400px' }}>{errorMsg}</p>
                            <button className="action-btn" onClick={handleOpenNatively} disabled={downloading}>
                                {downloading ? <Loader2 size={20} className="spin" /> : <ExternalLink size={20} />}
                                {downloading ? 'Opening...' : 'Try Downloading from Cloud'}
                            </button>
                        </div>
                    ) : type === 'image' ? (
                        <img src={content || ''} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '24px' }} />
                    ) : type === 'pdf' ? (
                        <iframe src={`data:application/pdf;base64,${content}`} style={{ width: '100%', height: '100%', border: 'none' }} title={fileName} />
                    ) : type === 'text' ? (
                        <div style={{ width: '100%', height: '100%', padding: '24px', overflow: 'auto', textAlign: 'left' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#e8e4dd', fontSize: '14px', fontFamily: 'Consolas, monospace', lineHeight: 1.6 }}>{content}</pre>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--ubv-bg-elevated)', borderRadius: '12px', border: '1px solid var(--ubv-border)' }}>
                            <FileText size={64} color="var(--ubv-text-muted)" style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Preview Not Available</h3>
                            <p className="marker" style={{ marginBottom: '24px', maxWidth: '400px' }}>
                                This file type cannot be rendered inside the app. Download and open it using your system's default software.
                            </p>
                            <button className="action-btn" onClick={handleOpenNatively} disabled={downloading}>
                                {downloading ? <Loader2 size={20} className="spin" /> : <ExternalLink size={20} />}
                                {downloading ? 'Opening...' : 'Open in Default App'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}