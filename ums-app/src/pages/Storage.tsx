// Path: ums-app/src/pages/Storage.tsx
// Purpose: Cloud Drive UI with local fallback, file viewing, and cycling sort toggle.

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useOutletContext } from 'react-router-dom';
import { useUploads } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import { open } from '@tauri-apps/plugin-dialog';
import { Folder, FileText, Loader2, AlertCircle, Building2, Briefcase, ChevronRight, X, RefreshCw, CheckCircle2, Home, User as UserIcon, FileImage, FileArchive, FileSpreadsheet, FolderOpen, Eye, WifiOff, LayoutGrid, List, Search, ArrowUpDown } from 'lucide-react';
import FileViewerModal from '../components/Layout/FileViewerModal';

interface S3Object {
    key: string;
    size: number;
    is_folder: boolean;
    last_modified: string | null;
}

export default function Storage() {
    const { syncConfig, user, reportCloudStatus } = useOutletContext<any>();
    const { toast } = useToast();
    
    const [currentPrefix, setCurrentPrefix] = useState<string>(`${user.path}/`);
    const [files, setFiles] = useState<S3Object[]>([]);
    const [selectedItem, setSelectedItem] = useState<S3Object | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortMode, setSortMode] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>(() => {
        const saved = localStorage.getItem('ums-sort-mode');
        return (saved as any) || 'name-asc';
    });
    const [filterQuery, setFilterQuery] = useState('');

    const [viewingFile, setViewingFile] = useState<{ key: string, name: string, lastModified: string | null } | null>(null);

    const { uploadQueue, addUpload, failUpload, clearUploads } = useUploads();

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharingFile, setSharingFile] = useState<string | null>(null);
    const [shareError, setShareError] = useState<string | null>(null);

    // Persist sort mode
    useEffect(() => {
        localStorage.setItem('ums-sort-mode', sortMode);
    }, [sortMode]);

    const fetchFiles = (prefix: string = currentPrefix) => {
        setLoading(true);
        setSelectedItem(null); 
        setFilterQuery('');
        invoke<S3Object[]>('list_files', { prefix })
            .then((data) => { 
                setFiles(data); 
                setIsOffline(false);
                setLoading(false); 
                reportCloudStatus(true); 
            })
            .catch((err) => { 
                reportCloudStatus(false, `Cloud error: ${err}`); 
                if (syncConfig?.local_path) {
                    invoke<S3Object[]>('list_local_files', { 
                        localRoot: syncConfig.local_path, 
                        currentPrefix: prefix,
                        userPath: user.path
                    }).then(localFiles => {
                        setFiles(localFiles);
                        setIsOffline(true);
                        setLoading(false);
                    }).catch(() => {
                        setLoading(false);
                        setIsOffline(true);
                        toast(`Failed to fetch files. Please check connection.`, 'error', 0);
                    });
                } else {
                    setLoading(false);
                    setIsOffline(true);
                    toast(`Failed to list files: ${err}`, 'error', 0);
                }
            });
    };

    useEffect(() => {
        fetchFiles(currentPrefix);
    }, [currentPrefix]);

    const handleUpload = async () => {
        if (isOffline) {
            toast('Cannot upload while offline.', 'error');
            return;
        }
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
        if (isOffline) {
            toast('Cannot create folders while offline.', 'error');
            return;
        }
        const newKey = `${currentPrefix ? currentPrefix + '/' : ''}${newFolderName}/`;
        setFiles(prev => [...prev, { key: newKey, size: 0, is_folder: true, last_modified: null }]);
        setIsFolderModalOpen(false);
        setNewFolderName('');
        invoke('create_folder', { folderName: newFolderName, currentPrefix }).catch(() => fetchFiles());
    };

    const handleDelete = async (key: string) => {
        if (isOffline) {
            toast('Cannot delete files while offline.', 'error');
            return;
        }
        if (!window.confirm("Are you sure you want to delete this? This cannot be undone.")) return;
        setFiles(prev => prev.filter(f => f.key !== key));
        setSelectedItem(null);
        invoke('delete_object', { key }).catch(() => fetchFiles());
        toast('Item deleted.', 'info');
    };

    const handleShare = async (key: string) => {
        if (isOffline) {
            toast('Cannot share files while offline.', 'error');
            return;
        }
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
        if (isOffline) {
            toast('Cannot download from cloud while offline.', 'error');
            return;
        }
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

    const handleOpenLocal = () => {
        if (syncConfig?.local_path) {
            invoke('open_local_folder', { path: syncConfig.local_path })
                .catch(err => toast(`Failed to open folder: ${err}`, 'error'));
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
        if (['pdf'].includes(ext)) return { icon: <FileText size={viewMode === 'grid' ? 24 : 18} />, color: '#EB6F65' };
        if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return { icon: <FileText size={viewMode === 'grid' ? 24 : 18} />, color: '#4B9CD3' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: <FileSpreadsheet size={viewMode === 'grid' ? 24 : 18} />, color: '#2BB673' };
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: <FileArchive size={viewMode === 'grid' ? 24 : 18} />, color: '#F5AB82' };
        if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return { icon: <FileImage size={viewMode === 'grid' ? 24 : 18} />, color: '#9B59B6' };
        return { icon: <FileText size={viewMode === 'grid' ? 24 : 18} />, color: 'var(--ubv-text-muted)' };
    };

    const getFolderVisuals = (key: string) => {
        const depth = key.split('/').filter(Boolean).length;
        if (depth === 1) return { icon: <Building2 size={viewMode === 'grid' ? 24 : 18} />, color: '#EAB308' }; 
        if (depth === 2) return { icon: <Briefcase size={viewMode === 'grid' ? 24 : 18} />, color: '#a4b5d6' }; 
        return { icon: <Folder size={viewMode === 'grid' ? 24 : 18} />, color: 'var(--ubv-text-muted)' }; 
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

    // Sort and Filter Logic
    const handleSortToggle = () => {
        const modes: ('name-asc' | 'name-desc' | 'date-desc' | 'date-asc')[] = ['name-asc', 'name-desc', 'date-desc', 'date-asc'];
        const currentIndex = modes.indexOf(sortMode);
        setSortMode(modes[(currentIndex + 1) % modes.length]);
    };

    const getSortLabel = () => {
        if (sortMode === 'name-asc') return 'A - Z';
        if (sortMode === 'name-desc') return 'Z - A';
        if (sortMode === 'date-desc') return 'Newest';
        if (sortMode === 'date-asc') return 'Oldest';
        return 'Sort';
    };

    const processItems = (items: S3Object[], isFolder: boolean) => {
        let processed = items.filter(f => 
            parseFileMeta(f.key, isFolder).name.toLowerCase().includes(filterQuery.toLowerCase())
        );

        processed.sort((a, b) => {
            const nameA = parseFileMeta(a.key, isFolder).name.toLowerCase();
            const nameB = parseFileMeta(b.key, isFolder).name.toLowerCase();
            const dateA = a.last_modified ? new Date(a.last_modified).getTime() : 0;
            const dateB = b.last_modified ? new Date(b.last_modified).getTime() : 0;

            if (sortMode === 'name-asc') return nameA.localeCompare(nameB);
            if (sortMode === 'name-desc') return nameB.localeCompare(nameA);
            if (sortMode === 'date-desc') return dateB - dateA;
            if (sortMode === 'date-asc') return dateA - dateB;
            return 0;
        });
        return processed;
    };

    const folders = processItems(files.filter(f => f.is_folder), true);
    const fileItems = processItems(files.filter(f => !f.is_folder), false);

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
                <div className="page-header flex-between" style={{ marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Storage Drive</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p className="marker">
                                {syncConfig ? `Local Sync Active: ${syncConfig.local_path}` : `Cloud Workspace: ${user.path}`}
                            </p>
                            {syncConfig && (
                                <button className="icon-btn" onClick={handleOpenLocal} title="Open local folder" style={{ padding: '4px' }}>
                                    <FolderOpen size={16} color="var(--ubv-brand-gradient-start)" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="outline-btn" onClick={() => fetchFiles()}><RefreshCw size={16} /></button>
                        <button className="outline-btn" onClick={() => setIsFolderModalOpen(true)}>New Folder</button>
                        <button className="action-btn" onClick={handleUpload}>Upload File</button>
                    </div>
                </div>

                {isOffline && (
                    <div className="glass-panel flex-between" style={{ padding: '16px 24px', marginBottom: '16px', borderLeft: '4px solid var(--ubv-warning)', background: 'rgba(245, 171, 130, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <WifiOff size={24} color="var(--ubv-warning)" />
                            <div>
                                <h3 style={{ fontSize: '16px', marginBottom: '4px', color: 'var(--ubv-warning)' }}>Offline Mode</h3>
                                <p className="marker">Showing local files. Cloud sync is paused until connection is restored.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button className="text-btn" onClick={() => setCurrentPrefix('')} style={{ display: 'flex', alignItems: 'center', color: isAtRoot ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }} title="Storage Root"><Home size={18} /></button>
                    <span style={{ color: 'var(--ubv-text-muted)' }}>|</span>
                    <button className="text-btn" onClick={() => setCurrentPrefix(`${user.path}/`)} style={{ display: 'flex', alignItems: 'center', color: isUserHome ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }} title="My Workspace"><UserIcon size={18} /></button>
                    {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChevronRight size={16} color="var(--ubv-text-muted)" />
                            <button className="text-btn" onClick={() => setCurrentPrefix(crumb.path)} style={{ fontSize: '16px', color: i === breadcrumbs.length - 1 ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}>{crumb.name}</button>
                        </div>
                    ))}
                </div>

                {/* Filter & Sort Toolbar */}
                <div className="glass-panel flex-between" style={{ padding: '12px 16px', marginBottom: '24px', background: 'rgba(128,128,128,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '300px' }}>
                        <Search size={16} color="var(--ubv-text-muted)" />
                        <input 
                            type="text" 
                            placeholder="Filter by name..." 
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="form-input" 
                            style={{ background: 'transparent', border: 'none', padding: '4px 8px', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button className="outline-btn" onClick={handleSortToggle} style={{ minWidth: '80px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowUpDown size={14} /> {getSortLabel()}
                        </button>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(128,128,128,0.1)', padding: '4px', borderRadius: '6px' }}>
                            <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ opacity: viewMode === 'grid' ? 1 : 0.5 }}><LayoutGrid size={16} /></button>
                            <button className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ opacity: viewMode === 'list' ? 1 : 0.5 }}><List size={16} /></button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="glass-panel marker" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>
                ) : files.length === 0 ? (
                    <div className="glass-panel marker" style={{ padding: '48px', textAlign: 'center' }}>This folder is empty.</div>
                ) : (
                    <div>
                        {/* Folders */}
                        {folders.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--ubv-text-muted)', marginBottom: '16px' }}>Folders</h3>
                                <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', flexDirection: 'column', gap: viewMode === 'grid' ? '16px' : '8px' }}>
                                    {folders.map((folder) => {
                                        const { name } = parseFileMeta(folder.key, true);
                                        const visuals = getFolderVisuals(folder.key);
                                        return (
                                            <div 
                                                key={folder.key} 
                                                className="glass-panel" 
                                                style={{ 
                                                    padding: viewMode === 'grid' ? '16px' : '10px 16px', 
                                                    display: 'flex', 
                                                    flexDirection: viewMode === 'grid' ? 'column' : 'row', 
                                                    alignItems: viewMode === 'grid' ? 'flex-start' : 'center',
                                                    gap: viewMode === 'grid' ? '12px' : '12px', 
                                                    cursor: 'pointer', 
                                                    border: selectedItem?.key === folder.key ? '1px solid var(--ubv-brand-gradient-start)' : '1px solid var(--ubv-glass-border)' 
                                                }} 
                                                onClick={() => setSelectedItem(folder)}
                                                onDoubleClick={() => setCurrentPrefix(folder.key)}
                                                title="Double click to open"
                                            >
                                                <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                                <div style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '14px' }}>{name}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {fileItems.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--ubv-text-muted)', marginBottom: '16px' }}>Files</h3>
                                <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', flexDirection: 'column', gap: viewMode === 'grid' ? '16px' : '8px' }}>
                                    {fileItems.map((file) => {
                                        const visuals = getFileVisuals(file.key);
                                        const { name } = parseFileMeta(file.key, false);
                                        return (
                                            <div 
                                                key={file.key} 
                                                className="glass-panel" 
                                                style={{ 
                                                    padding: viewMode === 'grid' ? '16px' : '10px 16px', 
                                                    display: 'flex', 
                                                    flexDirection: viewMode === 'grid' ? 'column' : 'row', 
                                                    alignItems: viewMode === 'grid' ? 'flex-start' : 'center',
                                                    justifyContent: viewMode === 'grid' ? 'flex-start' : 'space-between',
                                                    gap: viewMode === 'grid' ? '12px' : '12px', 
                                                    cursor: 'pointer', 
                                                    border: selectedItem?.key === file.key ? '1px solid var(--ubv-brand-gradient-start)' : '1px solid var(--ubv-glass-border)' 
                                                }} 
                                                onClick={() => setSelectedItem(file)}
                                                onDoubleClick={() => setViewingFile({ key: file.key, name: parseFileMeta(file.key, false).name, lastModified: file.last_modified })}
                                                title="Double click to open"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
                                                    <div style={{ color: visuals.color }}>{visuals.icon}</div>
                                                    <div style={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '14px' }}>{name}</div>
                                                </div>
                                                <div className="flex-between" style={{ marginTop: viewMode === 'grid' ? 'auto' : 0, width: viewMode === 'grid' ? '100%' : 'auto' }}>
                                                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{formatSize(file.size)}</span>
                                                    {viewMode === 'list' && <span className="marker" style={{ fontSize: '11px', marginLeft: '16px' }}>{formatDate(file.last_modified)}</span>}
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

            {/* Details Panel */}
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
                                    {job.message && <div style={{ fontSize: '11px', color: job.status === 'error' ? 'var(--ubv-danger)' : 'var(--ubv-text-muted)', marginTop: '4px' }}>{job.message}</div>}
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
                            {selectedItem.is_folder ? <div style={{ color: getFolderVisuals(selectedItem.key).color }}>{getFolderVisuals(selectedItem.key).icon}</div> : <div style={{ color: getFileVisuals(selectedItem.key).color }}>{getFileVisuals(selectedItem.key).icon}</div>}
                            <div style={{ fontWeight: 500, marginTop: '16px', textAlign: 'center', wordBreak: 'break-all' }}>{parseFileMeta(selectedItem.key, selectedItem.is_folder).name}</div>
                            <div className="marker" style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center' }}>in {parseFileMeta(selectedItem.key, selectedItem.is_folder).dir}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Size</span><div style={{ fontSize: '14px' }}>{selectedItem.is_folder ? '-' : formatSize(selectedItem.size)}</div></div>
                            <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Modified</span><div style={{ fontSize: '14px' }}>{formatDate(selectedItem.last_modified)}</div></div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                            {!selectedItem.is_folder && (
                                <>
                                    <button className="action-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setViewingFile({ key: selectedItem.key, name: parseFileMeta(selectedItem.key, false).name, lastModified: selectedItem.last_modified })}>
                                        <Eye size={16} /> Open File
                                    </button>
                                    <button className="outline-btn" style={{ width: '100%' }} onClick={() => handleDownload(selectedItem.key)} disabled={downloading === selectedItem.key || isOffline}>
                                        {downloading === selectedItem.key ? 'Downloading...' : 'Download to PC'}
                                    </button>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {!selectedItem.is_folder && <button className="outline-btn" style={{ flex: 1 }} onClick={() => handleShare(selectedItem.key)} disabled={isOffline}>Share Link</button>}
                                <button className="outline-btn" style={{ flex: 1, color: 'var(--ubv-danger)', borderColor: 'var(--ubv-danger)' }} onClick={() => handleDelete(selectedItem.key)} disabled={isOffline}>Delete</button>
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
                        {shareError ? <div style={{ color: 'var(--ubv-danger)', marginBottom: '16px', fontSize: '14px' }}>{shareError}</div> : (
                            <>
                                <p className="marker" style={{ marginBottom: '16px' }}>Anyone with this link can download <strong>{sharingFile.split('/').pop()}</strong> for the next 1 hour.</p>
                                <div className="form-group"><input type="text" className="form-input" value={shareUrl || ''} readOnly /></div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="action-btn" onClick={() => { navigator.clipboard.writeText(shareUrl || ''); toast('Link copied!', 'success'); }}>Copy Link</button></div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {viewingFile && (
                <FileViewerModal 
                    fileKey={viewingFile.key} 
                    fileName={viewingFile.name} 
                    lastModified={viewingFile.lastModified}
                    onClose={() => setViewingFile(null)} 
                    localRoot={syncConfig?.local_path || null}
                    userPath={user.path}
                />
            )}
        </div>
    );
}