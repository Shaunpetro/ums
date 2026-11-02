// Path: ums-app/src/pages/Clients.tsx
// Purpose: CRM Directory for managing client companies, contacts, and interaction history.

import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, ExternalLink, Activity } from 'lucide-react';

const MOCK_CLIENTS = [
    {
        id: 'c1',
        name: 'VSC Mining',
        industry: 'Mining & Resources',
        contactPerson: 'John Doe',
        email: 'john.d@vscmining.co.za',
        phone: '+27 11 123 4567',
        location: 'Johannesburg, ZA',
        activeProjects: 2,
        pipelineValue: 'R 2.4M',
        status: 'Active',
        recentActivity: [
            { id: 1, action: 'Invoice INV-2026-089 created', date: '2 days ago' },
            { id: 2, action: 'Tender: North Shaft Expansion submitted', date: 'Oct 24, 2026' },
            { id: 3, action: 'Meeting with John Doe', date: 'Oct 15, 2026' }
        ]
    },
    {
        id: 'c2',
        name: 'Transnet',
        industry: 'Logistics & Rail',
        contactPerson: 'Sarah Smith',
        email: 's.smith@transnet.net',
        phone: '+27 11 987 6543',
        location: 'Pretoria, ZA',
        activeProjects: 1,
        pipelineValue: 'R 1.2M',
        status: 'Active',
        recentActivity: [
            { id: 1, action: 'Tender: Conveyor Belt Maintenance identified', date: 'Yesterday' }
        ]
    },
    {
        id: 'c3',
        name: 'ATG DesEng',
        industry: 'Engineering',
        contactPerson: 'Michael Johnson',
        email: 'michael@atg.co.za',
        phone: '+27 82 555 1234',
        location: 'Cape Town, ZA',
        activeProjects: 0,
        pipelineValue: 'R 12.5K',
        status: 'Past Due',
        recentActivity: [
            { id: 1, action: 'Invoice INV-2026-088 marked overdue', date: '3 days ago' },
            { id: 2, action: 'Final project sign-off', date: 'Sep 28, 2026' }
        ]
    }
];

export default function Clients() {
    const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
    const selectedClient = MOCK_CLIENTS.find(c => c.id === selectedClientId) || MOCK_CLIENTS[0];

    return (
        <div className="clients-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Clients & CRM</h1>
                    <p className="marker">Manage companies, primary contacts, and deal history.</p>
                </div>
                <button className="action-btn">Add New Client</button>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Clients</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>14</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Pipeline Value</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-success)' }}>R 8.7M</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Required</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-danger)' }}>1 Overdue</h2>
                </div>
            </div>

            {/* Master-Detail Layout */}
            <div className="tender-layout">
                
                {/* Left Side: Client List */}
                <div className="tender-list">
                    {MOCK_CLIENTS.map(client => (
                        <div 
                            key={client.id} 
                            className={`tender-list-item ${selectedClientId === client.id ? 'active' : ''}`}
                            onClick={() => setSelectedClientId(client.id)}
                        >
                            <div className="flex-between">
                                <span className={`badge ${client.status === 'Active' ? 'success' : 'danger'}`}>{client.status}</span>
                            </div>
                            <h4 style={{ marginTop: '8px' }}>{client.name}</h4>
                            <div className="marker" style={{ marginTop: '4px' }}>{client.industry}</div>
                        </div>
                    ))}
                </div>

                {/* Right Side: Client Details */}
                <div className="tender-detail glass-panel" style={{ padding: '24px' }}>
                    
                    {/* Header */}
                    <div className="flex-between" style={{ alignItems: 'flex-start', borderBottom: '1px solid var(--ubv-border)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div className="avatar-circle" style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ubv-bg-elevated)' }}>
                                <Building2 size={32} style={{ color: 'var(--ubv-brand-gradient-start)' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>{selectedClient.name}</h2>
                                <p className="marker">{selectedClient.industry}</p>
                            </div>
                        </div>
                        <button className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ExternalLink size={14} /> View Full Profile
                        </button>
                    </div>

                    {/* Contact Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Primary Contact</span>
                            <div style={{ fontWeight: 500, marginTop: '4px' }}>{selectedClient.contactPerson}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Email</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '14px', color: 'var(--ubv-brand-gradient-start)' }}>
                                <Mail size={14} /> {selectedClient.email}
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Phone</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '14px' }}>
                                <Phone size={14} /> {selectedClient.phone}
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.05)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Location</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '14px' }}>
                                <MapPin size={14} /> {selectedClient.location}
                            </div>
                        </div>
                    </div>

                    {/* Financial & Project Summary */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                        <div className="glass-panel" style={{ flex: 1, padding: '16px', borderLeft: '3px solid var(--ubv-success)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Active Projects</span>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>{selectedClient.activeProjects}</div>
                        </div>
                        <div className="glass-panel" style={{ flex: 1, padding: '16px', borderLeft: '3px solid var(--ubv-brand-gradient-start)' }}>
                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Pipeline Value</span>
                            <div style={{ fontSize: '24px', fontWeight: 600 }}>{selectedClient.pipelineValue}</div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ubv-text-muted)', marginBottom: '16px' }}>Recent Activity</h4>
                        {selectedClient.recentActivity.map(activity => (
                            <div key={activity.id} className="timeline-item done" style={{ paddingBottom: '16px' }}>
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <h5>{activity.action}</h5>
                                    <span className="marker">{activity.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}