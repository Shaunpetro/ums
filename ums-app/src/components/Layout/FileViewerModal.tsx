// Path: ums-app/src/components/Layout/FileViewerModal.tsx
// Purpose: In-app file viewer for images and text, with download fallback for heavy files.

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../context/ToastContext';
import { X, Loader2, Download } from 'lucide-react';

interface Props {
    fileKey: string;
    fileName: string;
    onClose: () => void;
}

export default function FileViewerModal({ fileKey, fileName, onClose }: Props) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<string | null>(null);
    const [type, setType] = useState<'image' | 'text' | 'unsupported' | null>(null);

    useEffect(() => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
        const isText = ['txt', 'csv', 'json', 'md', 'log', 'xml'].includes(ext);

        if (isImage || isText) {
            setType(isImage ? 'image' : 'text');
            setLoading(true);
            invoke<string>('get_file_preview_data', { key: fileKey })
                .then(b64 => {
                    if (isImage) {
                        setContent(`data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${b64}`);
                    } else {
                        // Decode base64 to text for text files
                        const text = decodeURIComponent(escape(window.atob(b64)));
                        setContent(text);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    toast(`Preview failed: ${err}`, 'error');
                    onClose();
                });
        } else {
            setType('unsupported');
            setLoading(false);
        }
    }, [fileKey, fileName]);

    const handleDownloadAndOpen = async () => {
        try {
            const savedPath = await invoke<string>('download_file', { key: fileKey });
            await invoke('open_local_folder', { path: savedPath.split('\\').slice(0, -1).join('\\') });
            // We use the opener plugin to launch the file itself
            // Note: If you don't have the opener plugin configured for files yet, just downloading to Downloads is fine.
            toast(`File downloaded to: ${savedPath}`, 'success');
            onClose();
        } catch (err) {
            toast(`Download failed: ${err}`, 'error');
        }
    };

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.95)' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', width: '100%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title" style={{ wordBreak: 'break-all' }}>{fileName}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Loader2 size={32} className="spin" color="var(--ubv-brand-gradient-start)" />
                            <span className="marker">Fetching file securely...</span>
                        </div>
                    ) : type === 'image' ? (
                        <img src={content || ''} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : type === 'text' ? (
                        <pre style={{ width: '100%', height: '100%', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--ubv-text-main)', fontSize: '13px', fontFamily: 'monospace' }}>
                            {content}
                        </pre>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <p className="marker" style={{ marginBottom: '16px' }}>Inline preview is not supported for this file type.</p>
                            <button className="action-btn" onClick={handleDownloadAndOpen} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={16} /> Download & Open in Default App
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}