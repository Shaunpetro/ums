// Path: ums-app/src/components/Layout/LoginScreen.tsx
// Purpose: Username/password authentication against Autentico.

import { useState, FormEvent } from 'react';
import { Shield, User as UserIcon, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const u = username.trim();
        if (!u) {
            setError('Username is required.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }

        setSubmitting(true);
        try {
            await login(u, password);
            // On success, authState flips to 'authenticated' and this screen unmounts.
        } catch (err) {
            const msg = typeof err === 'string' ? err : 'Login failed. Please try again.';
            setError(msg);
            setSubmitting(false);
        }
    };

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

            <div className="glass-panel" style={{ padding: '48px', width: '100%', maxWidth: '420px', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--ubv-brand-gradient)', marginBottom: '16px' }}>
                        <Shield size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Welcome to Ubuveil</h1>
                    <p className="marker">Sign in to your VSC Mining workspace.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Username</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ubv-text-muted)', pointerEvents: 'none' }}>
                                <UserIcon size={16} />
                            </span>
                            <input
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Your username"
                                autoFocus
                                autoComplete="username"
                                disabled={submitting}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ubv-text-muted)', pointerEvents: 'none' }}>
                                <Lock size={16} />
                            </span>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                autoComplete="current-password"
                                disabled={submitting}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(235, 111, 101, 0.12)',
                            border: '1px solid var(--ubv-danger)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            color: 'var(--ubv-danger)',
                            fontSize: '13px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="action-btn"
                        disabled={submitting}
                        style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                    >
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="marker" style={{ textAlign: 'center', fontSize: '11px', marginTop: '24px' }}>
                    Authentication is handled by Autentico on the local network.
                </p>
            </div>
        </div>
    );
}