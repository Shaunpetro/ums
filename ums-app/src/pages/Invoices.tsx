// Path: ums-app/src/pages/Invoices.tsx
// Purpose: Invoice tracker testing Data Tables and the global Modal component.

import { useState } from 'react';
import { X } from 'lucide-react';

const MOCK_INVOICES = [
    { id: 'INV-2026-089', client: 'VSC Mining', amount: 'R 45,000.00', date: 'Oct 24, 2026', status: 'Draft', statusColor: 'warning' },
    { id: 'INV-2026-088', client: 'ATG DesEng', amount: 'R 12,500.00', date: 'Oct 15, 2026', status: 'Overdue', statusColor: 'danger' },
    { id: 'INV-2026-085', client: 'UMS Setup', amount: 'R 89,000.00', date: 'Oct 01, 2026', status: 'Paid', statusColor: 'success' },
    { id: 'INV-2026-082', client: 'Transnet', amount: 'R 120,000.00', date: 'Sep 28, 2026', status: 'Paid', statusColor: 'success' },
];

export default function Invoices() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="invoices-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '4px' }}>Invoices & Quotes</h1>
                    <p className="marker">Manage billing, track payments, and send follow-ups.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="outline-btn">Create Quote</button>
                    <button className="action-btn" onClick={() => setIsModalOpen(true)}>New Invoice</button>
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Outstanding</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px' }}>R 124,500.00</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Overdue</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-danger)' }}>R 12,500.00</h2>
                </div>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Paid This Month</span>
                    <h2 style={{ fontSize: '28px', fontWeight: 600, marginTop: '8px', color: 'var(--ubv-success)' }}>R 209,000.00</h2>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_INVOICES.map(inv => (
                            <tr key={inv.id}>
                                <td><strong>{inv.id}</strong></td>
                                <td>{inv.client}</td>
                                <td>{inv.amount}</td>
                                <td>{inv.date}</td>
                                <td><span className={`badge ${inv.statusColor}`}>{inv.status}</span></td>
                                <td>
                                    <button className="text-btn">
                                        {inv.status === 'Draft' ? 'Send' : inv.status === 'Overdue' ? 'Follow Up' : 'Download'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Test */}
            <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
                <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Create New Invoice</h2>
                        <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                    </div>
                    <div className="form-group">
                        <label>Client Name</label>
                        <input type="text" className="form-input" placeholder="e.g. VSC Mining" />
                    </div>
                    <div className="form-group">
                        <label>Amount (ZAR)</label>
                        <input type="number" className="form-input" placeholder="0.00" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button className="outline-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button className="action-btn" onClick={() => setIsModalOpen(false)}>Save Invoice</button>
                    </div>
                </div>
            </div>
        </div>
    );
}