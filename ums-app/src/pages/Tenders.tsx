// Path: ums-app/src/pages/Tenders.tsx
// Purpose: Master-Detail Tender Workspace handling multiple active tenders, compliance vaults, and summaries.

import { useState } from 'react';
import { FileText, Paperclip, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

// Mock Data representing what comes from the database/S3 later
const MOCK_TENDERS = [
    {
        id: 'TND-001',
        title: 'North Shaft Expansion',
        client: 'VSC Mining',
        value: 'R 2.4M',
        dueDate: 'Nov 05, 2026',
        status: 'Drafting',
        progress: 75,
        requirements: [
            { id: 1, name: 'Tax Clearance Certificate', status: 'valid', expiry: '2027-05-12' },
            { id: 2, name: 'B-BBEE Certificate', status: 'valid', expiry: '2026-12-01' },
            { id: 3, name: 'Safety File', status: 'missing', expiry: null },
            { id: 4, name: 'Pricing Schedule', status: 'drafting', expiry: null },
        ]
    },
    {
        id: 'TND-002',
        title: 'Conveyor Belt Maintenance',
        client: 'Transnet',
        value: 'R 1.2M',
        dueDate: 'Nov 15, 2026',
        status: 'Identified',
        progress: 15,
        requirements: [
            { id: 1, name: 'Tax Clearance Certificate', status: 'expiring', expiry: '2026-11-01' }, // Expiring soon!
            { id: 2, name: 'CIDB Grading', status: 'missing', expiry: null },
        ]
    },
    {
        id: 'TND-003',
        title: 'Safety Gear Supply',
        client: 'ATG DesEng',
        value: 'R 150K',
        dueDate: 'Oct 20, 2026',
        status: 'Submitted',
        progress: 100,
        requirements: [
            { id: 1, name: 'Tax Clearance Certificate', status: 'valid', expiry: '2027-05-12' },
            { id: 2, name: 'B-BBEE Certificate', status: 'valid', expiry: '2026-12-01' },
        ]
    }
];

export default function Tenders() {
    const [selectedTenderId, setSelectedTenderId] = useState(MOCK_TENDERS[0].id);
    const selectedTender = MOCK_TENDERS.find(t => t.id === selectedTenderId) || MOCK_TENDERS[0];

    // Helper to render compliance badges based on status
    const renderComplianceBadge = (status: string) => {
        switch (status) {
            case 'valid': return <span className="badge success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Valid</span>;
            case 'expiring': return <span className="badge warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Expiring Soon</span>;
            case 'missing': return <span className="badge danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Missing</span>;
            case 'drafting': return <span className="badge warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Drafting</span>;
            default: return null;
        }
    };

    return (
        <div className="tenders-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Tender Workspace</h1>
                    <p className="marker">Manage 5 active opportunities and compliance readiness.</p>
                </div>
                <button className="action-btn">New Opportunity</button>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Pipeline Value</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>R 3.75M</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Compliance Alerts</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-warning)' }}>2 Missing</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Deadlines This Week</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-danger)' }}>1</h2>
                </div>
            </div>

            {/* Master-Detail Layout */}
            <div className="tender-layout">
                
                {/* Left Side: Tender List */}
                <div className="tender-list">
                    {MOCK_TENDERS.map(tender => (
                        <div 
                            key={tender.id} 
                            className={`tender-list-item ${selectedTenderId === tender.id ? 'active' : ''}`}
                            onClick={() => setSelectedTenderId(tender.id)}
                        >
                            <div className="flex-between">
                                <span className="marker" style={{ fontSize: '11px' }}>{tender.id}</span>
                                <span className={`badge ${tender.status === 'Submitted' ? 'success' : tender.status === 'Identified' ? '' : 'warning'}`}>{tender.status}</span>
                            </div>
                            <h4>{tender.title}</h4>
                            <div className="flex-between" style={{ marginTop: '12px' }}>
                                <span className="marker">{tender.client}</span>
                                <span className="marker" style={{ color: 'var(--ubv-text-main)', fontWeight: 500 }}>{tender.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Side: Selected Tender Details */}
                <div className="tender-detail glass-panel" style={{ padding: '24px' }}>
                    
                    {/* Tender Summary Header */}
                    <div className="flex-between" style={{ alignItems: 'flex-start', borderBottom: '1px solid var(--ubv-border)', paddingBottom: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>{selectedTender.title}</h2>
                            <p className="marker">Client: {selectedTender.client} | Due: {selectedTender.dueDate}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div className="circular-progress" style={{ '--percent': selectedTender.progress } as React.CSSProperties}>
                                <span>{selectedTender.progress}%</span>
                            </div>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Ready</span>
                        </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ubv-text-muted)', marginBottom: '16px' }}>Compliance & Requirements</h4>
                        
                        {selectedTender.requirements.map(req => (
                            <div key={req.id} className="vault-item">
                                <div className="vault-doc-name">
                                    <FileText size={16} color="var(--ubv-text-muted)" />
                                    {req.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {req.expiry && <span className="marker" style={{ fontSize: '11px' }}>Exp: {req.expiry}</span>}
                                    {renderComplianceBadge(req.status)}
                                    
                                    {/* Attach Document Button (Shows if missing or expiring) */}
                                    {(req.status === 'missing' || req.status === 'expiring') && (
                                        <button className="outline-btn" style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Paperclip size={12} /> Attach
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tender Timeline / Activity */}
                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ubv-text-muted)', marginBottom: '16px' }}>Recent Activity</h4>
                        <div className="timeline-item done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h5>Tax Clearance uploaded to Vault</h5>
                                <span className="marker">Petro M. • 2 hours ago</span>
                            </div>
                        </div>
                        <div className="timeline-item active">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <h5>Drafting Safety File</h5>
                                <span className="marker">Shaun M. • Yesterday</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}