// Path: ums-app/src/pages/Dashboard.tsx
// Purpose: Main dashboard overview with responsive fluid grids.

export default function Dashboard() {
    return (
        <div className="dashboard-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Dashboard</h1>
                    <p className="marker">Welcome back, Petro. Here is your overview.</p>
                </div>
                <button className="action-btn">Customize Layout</button>
            </div>

            {/* The `auto-fit` grid guarantees full-width expansion on large screens */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '24px', minHeight: '250px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>Recent Files</h3>
                    <div className="marker">[ File List Placeholder - Will connect to S3 Sync State ]</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', minHeight: '250px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>Active Tenders</h3>
                    <div className="marker">[ Tender Tracker Placeholder ]</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', minHeight: '250px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>Invoice Tracker</h3>
                    <div className="marker">[ Invoice Placeholder ]</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', minHeight: '250px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 500, borderBottom: '1px solid var(--ubv-border)', paddingBottom: '12px', marginBottom: '16px' }}>My Tasks</h3>
                    <div className="marker">[ Task Placeholder ]</div>
                </div>
            </div>
        </div>
    );
}