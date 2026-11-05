// Path: ums-app/src/components/Layout/FileLuSetupModal.tsx
// Purpose: Modal for FileLu credential entry, reconnection, and connection testing.

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
    onComplete: () => void;
    onLogout?: () => void | Promise<void>;
    onClose?: () => void;
    apiError?: string | null;
}

export default function FileLuSetupModal({ onComplete, onLogout, onClose, apiError }: Props) {
    const { toast } = useToast();
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [endpoint, setEndpoint] = useState('https://eu.s5lu.com');
    const [bucket, setBucket] = useState('ums-prod');
    
    const [isExisting, setIsExisting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if we already have keys saved
        invoke<{ all_set: boolean }>('get_filelu_credentials_status').then(status => {
            if (status.all_set) {
                setIsExisting(true);
                setAccessKey('••••••••••••••••');
                setSecretKey('••••••••••••••••');
            }
        });
    }, []);

    const getFinalKeys = () => {
        const finalAccess = accessKey.includes('•') ? '' : accessKey.trim();
        const finalSecret = secretKey.includes('•') ? '' : secretKey.trim();
        return { finalAccess, finalSecret };
    };

    const handleTestConnection = async () => {
        const { finalAccess, finalSecret } = getFinalKeys();
        if (!isExisting && (!finalAccess || !finalSecret)) {
            setError('Enter keys before testing.');
            return;
        }
        setTesting(true);
        setError(null);
        try {
            // We temporarily save to test, then the user can save permanently
            await invoke('set_filelu_credentials', {
                accessKey: finalAccess, secretKey: finalSecret,
                endpoint: endpoint.trim(), bucket: bucket.trim()
            });
            // Test the actual connection
            await invoke('list_files', { prefix: '/' });
            toast('Connection successful! FileLu is reachable.', 'success');
            setError(null);
        } catch (err) {
            setError(`Connection failed: ${err}`);
            toast(`Connection failed: ${err}`, 'error', 0); // Persistent error
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async () => {
        const { finalAccess, finalSecret } = getFinalKeys();
        if (!isExisting && (!finalAccess || !finalSecret)) {
            setError('Access key and secret key are required.');
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            await invoke('set_filelu_credentials', {
                accessKey: finalAccess, secretKey: finalSecret,
                endpoint: endpoint.trim(), bucket: bucket.trim(),
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
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <Key size={48} color="var(--ubv-brand-gradient-start)" />
                </div>
                
                <p className="marker" style={{ textAlign: 'center', marginBottom: '16px' }}>
                    Enter your FileLu S3 credentials. They are stored securely in Windows Credential Manager.
                </p>

                {apiError && (
                    <div style={{ background: 'rgba(235, 111, 101, 0.1)', border: '1px solid var(--ubv-danger)', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ubv-danger)', fontSize: '13px' }}>
                        <AlertTriangle size={18} />
                        <span>{apiError}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Access Key</span>
                        <input type="text" value={accessKey} onChange={e => setAccessKey(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading || testing} autoComplete="off" />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Secret Key</span>
                        <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading || testing} autoComplete="off" />
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <label style={{ fontSize: '13px', flex: 1 }}>
                            <span className="marker">Endpoint</span>
                            <input type="text" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading || testing} />
                        </label>
                        <label style={{ fontSize: '13px', flex: 1 }}>
                            <span className="marker">Bucket</span>
                            <input type="text" value={bucket} onChange={e => setBucket(e.target.value)} className="form-input" style={{ width: '100%', marginTop: '4px' }} disabled={loading || testing} />
                        </label>
                    </div>
                </div>

                {error && <div style={{ color: 'var(--ubv-danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center', wordBreak: 'break-word' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="outline-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleTestConnection} disabled={loading || testing}>
                        {testing ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
                        Test Connection
                    </button>
                    <button className="action-btn" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading || testing}>
                        {loading ? 'Saving...' : 'Save & Connect'}
                    </button>
                </div>

                {onLogout && (
                    <button onClick={() => { void onLogout(); }} style={{ marginTop: '16px', width: '100%', padding: '8px', background: 'transparent', border: 'none', color: 'var(--ubv-text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                        Log out and switch user
                    </button>
                )}
            </div>
        </div>
    );
}