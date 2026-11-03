// Path: ums-app/src/pages/Storage.tsx
// Purpose: Cloud Drive UI mapped to the logged-in user's tenant path.

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useOutletContext } from 'react-router-dom';
import { useUploads } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import { open } from '@tauri-apps/plugin-dialog';
import { Folder, FileText, Loader2, AlertCircle, Building2, Briefcase, ChevronRight, X, RefreshCw, CheckCircle2, Home, User as UserIcon, Clock, FileImage, FileArchive, FileSpreadsheet } from 'lucide-react';

interface S3Object {
    key: string;
    size: number;
    is_folder: boolean;
    last_modified: string | null;
}

export default function Storage() {
    const { syncConfig, user } = useOutletContext<any>();
    const { toast } = useToast();
    
    const [currentPrefix, setCurrentPrefix] = useState<string>(`${user.path}/`);
    const [files, setFiles] = useState<S3Object[]>([]);
    const [selectedItem, setSelectedItem] = useState<S3Object | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    
    const { uploadQueue, addUpload, failUpload, clearUploads } = useUploads();

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharingFile, setSharingFile] = useState<string | null>(null);
    const [shareError, setShareError] = useState<string | null>(null);

    const fetchFiles = (prefix: string = currentPrefix) => {
        setLoading(true);
        setSelectedItem(null); 
        invoke<S3Object[]>('list_files', { prefix })
            .then((data) => { setFiles(data); setError(null); setLoading(false); })
            .catch((err) => { setError(err); setLoading(false); });
    };

    useEffect(() => {
        fetchFiles(currentPrefix);
    }, [currentPrefix]);

    const handleUpload = async () => {
        try {
            const selected = await open({ multiple: false, title: 'Select a file' });
            if (selected && typeof selected === 'string') {
                const fileName = selected.split(/[\\/]/).pop() || 'Unknown file';
                const jobId = addUpload(fileName);
                invoke('upload_file', { filePath: selected, currentPrefix })
                    .catch((err) => failUpload(jobId, `${err}`));
            }
        } catch (err) {
            toast(`${err}`, 'error');
        }
    };

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const newKey = `${currentPrefix ? currentPrefix + '/' : ''}${newFolderName}/`;
        setFiles(prev => [...prev, { key: newKey, size: 0, is_folder: true, last_modified: null }]);
        setIsFolderModalOpen(false);
        setNewFolderName('');
        invoke('create_folder', { folderName: newFolderName, currentPrefix }).catch(() => fetchFiles());
    };

    const handleDelete = async (key: string) => {
        if (!window.confirm("Are you sure you want to delete this? This cannot be undone.")) return;
        setFiles(prev => prev.filter(f => f.key !== key));
        setSelectedItem(null);
        invoke('delete_object', { key }).catch(() => fetchFiles());
        toast('Item deleted.', 'info');
    };

    const handleShare = async (key: string) => {
        setSharingFile(key);
        setShareUrl(null);
        setShareError(null);
        try {
            const url = await invoke<string>('get_share_url', { key });
            setShareUrl(url);
        } catch (err: any) {
            if (err.includes("Presigned URLs are only available for premium users")) {
                setShareError("FileLu Free Tier does not support direct S3 sharing links. Please upgrade your FileLu account or use the Download button to save it locally.");
            } else {
                setShareError(`Failed to generate link: ${err}`);
            }
        }
    };

    const handleDownload = async (key: string) => {
        setDownloading(key);
        try {
            const savedPath = await invoke<string>('download_file', { key });
            toast(`File downloaded to: ${savedPath}`, 'success');
        } catch (err) {
            toast(`Download failed: ${err}`, 'error');
        } finally {
            setDownloading(null);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString();
    };

    const getFileVisuals = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['pdf'].includes(ext)) return { icon: <FileText size={24} />, color: '#EB6F65' };
        if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return { icon: <FileText size={24} />, color: '#4B9CD3' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: <FileSpreadsheet size={24} />, color: '#2BB673' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: <FileArchive size={24} />, color: '#F5AB82' };
        if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return { icon: <FileImage size={24} />, color: '#9B59B6' };
        return { icon: <FileText size={24} />, color: 'var(--ubv-text-muted)' };
    };

    const getFolderVisuals = (key: string) => {
        const depth = key.split('/').filter(Boolean).length;
        if (depth === 1) return { icon: <Building2 size={24} />, color: '#EAB308' }; 
        if (depth === 2) return { icon: <Briefcase size={24} />, color: '#a4b5d6' }; 
        return { icon: <Folder size={24} />, color: 'var(--ubv-text-muted)' }; 
    };

    const parseFileMeta = (key: string, isFolder: boolean) => {
        const cleanKey = isFolder ? key.replace(/\/$/, '') : key;
        const parts = cleanKey.split('/');
        const name = parts.pop() || '';
        let dir = parts.join('/');
        if (dir === '') dir = '/';
        else dir = `/${dir}/`;
        return { name, dir };
    };

    const folders = files.filter(f => f.is_folder);
    const fileItems = files.filter(f => !f.is_folder);
    const recentFiles = fileItems.slice(0, 3); 

    const isAtRoot = currentPrefix === '' || currentPrefix === '/';
    const cleanPrefix = currentPrefix.replace(/\/$/, '');
    const pathSegments = cleanPrefix.split('/').filter(Boolean);
    
    let accumulatedPath = '';
    const breadcrumbs = pathSegments.map((seg) => {
        accumulatedPath += `${seg}/`;
        return { name: seg, path: accumulatedPath };
    });

    const isUserHome = currentPrefix === `${user.path}/`;

    return (
        <div className="storage-page" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="page-header flex-between" style={{ marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Storage Drive</h1>
                        <p className="marker">
                            {syncConfig ? `Local Sync Active: ${syncConfig.local_path}` : `Cloud Workspace: ${user.path}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="outline-btn" onClick={() => fetchFiles()}><RefreshCw size={16} /></button>
                        <button className="outline-btn" onClick={() => setIsFolderModalOpen(true)}>New Folder</button>
                        <button className="action-btn" onClick={handleUpload}>Upload File</button>
                    </div>
                </div>

                <div className="glass-panel flex-between" style={{ padding: '16px 24px', marginBottom: '24px', borderLeft: error ? '4px solid var(--ubv-danger)' : '4px solid var(--ubv-success)' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>FileLu Connection</h3>
                        <p className="marker">{loading ? 'Syncing...' : error ? `Error: ${error}` : 'Online'}</p>
                    </div>
                    <div>{loading ? <Loader2 size={16} className="spin" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ubv-success)' }}></div>}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button 
                        className="text-btn" 
                        onClick={() => setCurrentPrefix('')} 
                        style={{ display: 'flex', alignItems: 'center', color: isAtRoot ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }} 
                        title="Storage Root"
                    >
                        <Home size={18} />
                    </button>
                    
                    <span style={{ color: 'var(--ubv-text-muted)' }}>|</span>

                    <button 
                        className="text-btn" 
                        onClick={() => setCurrentPrefix(`${user.path}/`)} 
                        style={{ display: 'flex', alignItems: 'center', color: isUserHome ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }} 
                        title="My Workspace"
                    >
                        <UserIcon size={18} />
                    </button>

                    {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChevronRight size={16} color="var(--ubv-text-muted)" />
                            <button 
                                className="text-btn" 
                                onClick={() => setCurrentPrefix(crumb.path)} 
                                style={{ fontSize: '16px', color: i === breadcrumbs.length - 1 ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="glass-panel marker" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>
                ) : files.length === 0 ? (
                    <div className="glass-panel marker" style={{ padding: '48px', textAlign: 'center' }}>This folder is empty.</div>
                ) : (
                    <div>
                        {isUserHome && recentFiles.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} /> Recent Updates
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                    {recentFiles.map(file => {
                                        const visuals = getFileVisuals(file.key);
                                        const { name } = parseFileMeta(file.key, false);
                                        return (
                                            <div key={`recent-${file.key}`} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setSelectedItem(file)}>
                                                <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '14px', wordBreak: 'break-all' }}>{name}</div>
                                                    <div className="marker" style={{ fontSize: '11px' }}>{formatDate(file.last_modified)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {folders.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Folders</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                    {folders.map((folder) => {
                                        const { name } = parseFileMeta(folder.key, true);
                                        const visuals = getFolderVisuals(folder.key);
                                        return (
                                            <div 
                                                key={folder.key} className="glass-panel" 
                                                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: selectedItem?.key === folder.key ? '1px solid var(--ubv-brand-gradient-start)' : '1px solid var(--ubv-glass-border)' }}
                                                onClick={() => setSelectedItem(folder)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }} onDoubleClick={() => setCurrentPrefix(folder.key)}>
                                                    <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                                    <div style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '14px' }}>{name}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {fileItems.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Files</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                                    {fileItems.map((file) => {
                                        const visuals = getFileVisuals(file.key);
                                        const { name } = parseFileMeta(file.key, false);
                                        return (
                                            <div 
                                                key={file.key} className="glass-panel" 
                                                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: selectedItem?.key === file.key ? '1px solid var(--ubv-brand-gradient-start)' : '1px solid var(--ubv-glass-border)' }}
                                                onClick={() => setSelectedItem(file)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
                                                    <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '14px' }}>{name}</div>
                                                    </div>
                                                </div>
                                                <div className="flex-between" style={{ marginTop: 'auto' }}>
                                                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{formatSize(file.size)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ width: '320px', flexShrink: 0, padding: '24px', position: 'sticky', top: '0' }}>
                {uploadQueue.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <div className="flex-between" style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Sync Status</h3>
                            <button className="text-btn" onClick={clearUploads} style={{ fontSize: '12px' }}>Clear</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {uploadQueue.map(job => (
                                <div key={job.id} className="glass-panel" style={{ padding: '12px', background: 'rgba(128,128,128,0.05)' }}>
                                    <div className="flex-between">
                                        <span style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{job.fileName}</span>
                                        {job.status === 'uploading' && <Loader2 size={14} className="spin" color="var(--ubv-warning)" />}
                                        {job.status === 'success' && <CheckCircle2 size={14} color="var(--ubv-success)" />}
                                        {job.status === 'error' && <AlertCircle size={14} color="var(--ubv-danger)" />}
                                    </div>
                                    {job.message && (
                                        <div style={{ fontSize: '11px', color: job.status === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-text-muted)', marginTop: '4px' }}>
                                            {job.message}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Details</h3>
                    {selectedItem && <button className="icon-btn" onClick={() => setSelectedItem(null)}><X size={16} /></button>}
                </div>

                {!selectedItem ? (
                    <div className="marker" style={{ textAlign: 'center', marginTop: '32px' }}>Select a file to view details.</div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                            {selectedItem.is_folder ? (
                                <div style={{ color: getFolderVisuals(selectedItem.key).color }}>{getFolderVisuals(selectedItem.key).icon}</div>
                            ) : (
                                <div style={{ color: getFileVisuals(selectedItem.key).color }}>{getFileVisuals(selectedItem.key).icon}</div>
                            )}
                            <div style={{ fontWeight: 500, marginTop: '16px', textAlign: 'center', wordBreak: 'break-all' }}>
                                {parseFileMeta(selectedItem.key, selectedItem.is_folder).name}
                            </div>
                            <div className="marker" style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>
                                in {parseFileMeta(selectedItem.key, selectedItem.is_folder).dir}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Size</span><div style={{ fontSize: '14px' }}>{selectedItem.is_folder ? '-' : formatSize(selectedItem.size)}</div></div>
                            <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Modified</span><div style={{ fontSize: '14px' }}>{formatDate(selectedItem.last_modified)}</div></div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                            {!selectedItem.is_folder && (
                                <button className="action-btn" style={{ width: '100%' }} onClick={() => handleDownload(selectedItem.key)} disabled={downloading === selectedItem.key}>
                                    {downloading === selectedItem.key ? 'Downloading...' : 'Download to PC'}
                                </button>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {!selectedItem.is_folder && <button className="outline-btn" style={{ flex: 1 }} onClick={() => handleShare(selectedItem.key)}>Share Link</button>}
                                <button className="outline-btn" style={{ flex: 1, color: 'var(--ubv-danger)', borderColor: 'var(--ubv-danger)' }} onClick={() => handleDelete(selectedItem.key)}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isFolderModalOpen && (
                <div className="modal-overlay open" onClick={() => setIsFolderModalOpen(false)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">New Folder</h2><button className="modal-close" onClick={() => setIsFolderModalOpen(false)}><X size={20} /></button></div>
                        <div className="form-group"><label>Name</label><input type="text" className="form-input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} /></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}><button className="outline-btn" onClick={() => setIsFolderModalOpen(false)}>Cancel</button><button className="action-btn" onClick={handleCreateFolder}>Create</button></div>
                    </div>
                </div>
            )}

            {(shareUrl || shareError) && sharingFile && (
                <div className="modal-overlay open" onClick={() => { setShareUrl(null); setSharingFile(null); setShareError(null); }}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2 className="modal-title">Share Link</h2><button className="modal-close" onClick={() => { setShareUrl(null); setSharingFile(null); setShareError(null); }}><X size={20} /></button></div>
                        
                        {shareError ? (
                            <div style={{ color: 'var(--ubv-danger)', marginBottom: '16px', fontSize: '14px' }}>{shareError}</div>
                        ) : (
                            <>
                                <p className="marker" style={{ marginBottom: '16px' }}>Anyone with this link can download <strong>{sharingFile.split('/').pop()}</strong> for the next 1 hour.</p>
                                <div className="form-group"><input type="text" className="form-input" value={shareUrl || ''} readOnly /></div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="action-btn" onClick={() => { navigator.clipboard.writeText(shareUrl || ''); toast('Link copied!', 'success'); }}>Copy Link</button></div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}