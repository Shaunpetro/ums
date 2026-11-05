// Path: ums-app/src/components/Layout/FileLuSetupModal.tsx
// Purpose: Modal for initial FileLu credential entry or reconnection.

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
    onComplete: () => void;
    onLogout?: () => void | Promise<void>;
    onClose?: () => void;
}

export default function FileLuSetupModal({ onComplete, onLogout, onClose }: Props) {
    const { toast } = useToast();
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [endpoint, setEndpoint] = useState('https://eu.s5lu.com');
    const [bucket, setBucket] = useState('ums-prod');
    
    const [isExisting, setIsExisting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if we already have keys saved so we can show the placeholder
        invoke<{ all_set: boolean }>('get_filelu_credentials_status').then(status => {
            if (status.all_set) {
                setIsExisting(true);
                setAccessKey('••••••••••••••••');
                setSecretKey('••••••••••••••••');
            }
        });
    }, []);

    const handleSubmit = async () => {
        // If they didn't change the masked placeholders, send blank strings
        const finalAccess = accessKey.includes('•') ? '' : accessKey.trim();
        const finalSecret = secretKey.includes('•') ? '' : secretKey.trim();

        if (!isExisting && (!finalAccess || !finalSecret)) {
            setError('Access key and secret key are required.');
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            await invoke('set_filelu_credentials', {
                accessKey: finalAccess,
                secretKey: finalSecret,
                endpoint: endpoint.trim(),
                bucket: bucket.trim(),
            });
            toast('FileLu credentials saved securely.', 'success');
            onComplete();
        } catch (err) {
            setError(`${err}`);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay open" style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="modal-content glass-panel" style={{ maxWidth: '500px', border: '1px solid var(--ubv-brand-gradient-start)' }}>
                <div className="modal-header" style={{ marginBottom: '16px' }}>
                    <h2 className="modal-title">Connect Storage</h2>
                    {onClose && <button className="modal-close" onClick={onClose}><X size={20} /></button>}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <Key size={48} color="var(--ubv-brand-gradient-start)" />
                </div>
                
                <p className="marker" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    Enter your FileLu S3 credentials. They are stored securely in Windows Credential Manager.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Access Key</span>
                        <input type="text" value={accessKey} onChange={e => setAccessKey(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading} autoComplete="off" />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Secret Key</span>
                        <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading} autoComplete="off" />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Endpoint</span>
                        <input type="text" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading} />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Bucket</span>
                        <input type="text" value={bucket} onChange={e => setBucket(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading} />
                    </label>
                </div>

                {error && <div style={{ color: 'var(--ubv-danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                <button className="action-btn" style={{ width: '100%', padding: '16px', fontSize: '16px' }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Connecting...' : 'Save & Connect'}
                </button>

                {onLogout && (
                    <button onClick={() => { void onLogout(); }} style={{ marginTop: '12px', width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'var(--ubv-text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                        Log out and switch user
                    </button>
                )}
            </div>
        </div>
    );
}