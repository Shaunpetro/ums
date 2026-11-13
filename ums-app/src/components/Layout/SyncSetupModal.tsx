// Path: ums-app/src/components/Layout/SyncSetupModal.tsx
// Purpose: First-Run modal forcing the user to select a local sync folder and mapping it to their tenant path.

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { HardDrive } from 'lucide-react';

interface Props {
    onComplete: (path: string, targetPrefix: string) => void;
    userPath: string;
}

export default function SyncSetupModal({ onComplete, userPath }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                title: 'Select a folder for your local workspace',
                multiple: false,
            });

            if (selected && typeof selected === 'string') {
                setLoading(true);
                await invoke('save_sync_config', {
                    localPath: selected,
                    syncTargetPrefix: userPath
                });
                onComplete(selected, userPath);
            }
        } catch (err) {
            setError(`${err}`);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay open" style={{ zIndex: 9999 }}>
            <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <HardDrive size={64} color="var(--ubv-brand-gradient-start)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', marginBottom: '12px' }}>Set Up Your Workspace</h2>
                <p className="marker" style={{ textAlign: 'center', marginBottom: '16px' }}>
                    Select a folder on your PC. Everything inside this folder will automatically sync to your personal cloud directory:
                </p>
                <div className="glass-panel" style={{ padding: '12px', textAlign: 'center', marginBottom: '24px' }}>
                    <code>{userPath}/</code>
                </div>

                {error && (
                    <div style={{ color: 'var(--ubv-danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button
                    className="action-btn"
                    style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    onClick={handleSelectFolder}
                    disabled={loading}
                >
                    {loading ? 'Setting up...' : 'Select Local Folder'}
                </button>
            </div>
        </div>
    );
}