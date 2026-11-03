// Path: ums-app/src/components/Layout/FileLuSetupModal.tsx
// Purpose: First-run modal for FileLu credential entry. Stores credentials in Windows Credential Manager via keyring.

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key } from 'lucide-react';

interface Props {
    onComplete: () => void;
    onLogout?: () => void | Promise<void>;
}

export default function FileLuSetupModal({ onComplete, onLogout }: Props) {
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [endpoint, setEndpoint] = useState('https://eu.s5lu.com');
    const [bucket, setBucket] = useState('ums-prod');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!accessKey.trim() || !secretKey.trim()) {
            setError('Access key and secret key are required.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await invoke('set_filelu_credentials', {
                accessKey: accessKey.trim(),
                secretKey: secretKey.trim(),
                endpoint: endpoint.trim(),
                bucket: bucket.trim(),
            });
            onComplete();
        } catch (err) {
            setError(`${err}`);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay open" style={{ zIndex: 9999, background: 'rgba(23, 21, 26, 0.9)' }}>
            <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <Key size={64} color="var(--ubv-brand-gradient-start)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', marginBottom: '12px' }}>Connect Storage</h2>
                <p className="marker" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    Enter your FileLu S3 credentials. They are stored securely in Windows Credential Manager and never leave this PC.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Access Key</span>
                        <input
                            type="text"
                            value={accessKey}
                            onChange={e => setAccessKey(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', marginTop: '4px' }}
                            disabled={loading}
                            autoComplete="off"
                        />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Secret Key</span>
                        <input
                            type="password"
                            value={secretKey}
                            onChange={e => setSecretKey(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', marginTop: '4px' }}
                            disabled={loading}
                            autoComplete="off"
                        />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Endpoint</span>
                        <input
                            type="text"
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', marginTop: '4px' }}
                            disabled={loading}
                        />
                    </label>
                    <label style={{ fontSize: '13px' }}>
                        <span className="marker">Bucket</span>
                        <input
                            type="text"
                            value={bucket}
                            onChange={e => setBucket(e.target.value)}
                            className="form-input"
                            style={{ width: '100%', marginTop: '4px' }}
                            disabled={loading}
                        />
                    </label>
                </div>

                {error && (
                    <div style={{ color: 'var(--ubv-danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button
                    className="action-btn"
                    style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Connecting...' : 'Connect Storage'}
                </button>

                {onLogout && (
                    <button
                        onClick={() => { void onLogout(); }}
                        style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ubv-text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        Log out and switch user
                    </button>
                )}
            </div>
        </div>
    );
}