// Path: ums-app/src/components/Layout/LoginScreen.tsx
// Purpose: Mock Auth profile selection screen.

import { useAuth, MOCK_USERS } from '../../context/AuthContext';
import { Shield, User as UserIcon } from 'lucide-react';

export default function LoginScreen() {
    const { login } = useAuth();

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>

            <div className="glass-panel" style={{ padding: '48px', width: '100%', maxWidth: '800px', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--ubv-brand-gradient)', marginBottom: '16px' }}>
                        <Shield size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Welcome to Ubuveil</h1>
                    <p className="marker">Select your profile to continue to the VSC Mining workspace.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {MOCK_USERS.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => login(user)}
                            className="glass-panel"
                            style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '1px solid var(--ubv-glass-border)',
                                background: 'var(--ubv-glass-bg)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'var(--ubv-brand-gradient-start)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--ubv-glass-border)';
                            }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(128,128,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <UserIcon size={32} color="var(--ubv-text-muted)" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px', color: 'var(--ubv-text-main)' }}>{user.name}</h3>
                            <span className="badge warning" style={{ marginBottom: '8px' }}>{user.role}</span>
                            <span className="marker" style={{ fontSize: '11px' }}>{user.dept}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}