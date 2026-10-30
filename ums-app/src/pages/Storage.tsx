// Path: ums-app/src/pages/Storage.tsx
// Purpose: File manager view with responsive layout.

export default function Storage() {
    return (
        <div className="storage-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Storage Drive</h1>
                    <p className="marker">Manage files, departments, and local sync.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="outline-btn">Switch to List View</button>
                    <button className="action-btn">New Folder</button>
                </div>
            </div>

            {/* Cloud Sync Card - Responsive flex */}
            <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', borderLeft: '4px solid var(--ubv-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Local Sync (E:\UMS_Sync)</h3>
                    <p className="marker">Last synced: Today at 10:45 AM</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ubv-success)', background: 'rgba(43, 182, 115, 0.15)', padding: '4px 8px', borderRadius: '4px' }}>SYNCED</span>
                    <button style={{ background: 'none', border: 'none', color: 'var(--ubv-brand-gradient-start)', cursor: 'pointer' }}>View Logs</button>
                </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Departments</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>Finance</div>
                    <div className="marker">12 GB</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>Operations</div>
                    <div className="marker">8 GB</div>
                </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Sites</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                 <div className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>CRM</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>Kopanang</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>Transnet</div>
                </div>
            </div>
        </div>
    );
}