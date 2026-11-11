// Path: ums-app/src/components/Company/CompanyProfile.tsx
// Purpose: Read-only company profile view.

import { useState } from 'react';
import { X, Building2, ShieldCheck, Mail, Download, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export default function CompanyProfile({ onClose }: Props) {
    const [activeTab, setActiveTab] = useState<'details' | 'compliance' | 'email'>('details');

    // Hardcoded VSC Mining Data for now
    const companyData = {
        legalName: 'VSC Mining (Pty) Ltd',
        tradingName: 'VSC Mining',
        vatNumber: '4123456789',
        regNumber: '2020/123456/07',
        address: '123 Main Reef Road, Johannesburg, 2001',
        phone: '+27 11 123 4567',
        email: 'info@vscmining.co.za',
        bankName: 'Standard Bank',
        bankAccount: '123456789',
        bankBranch: '051001'
    };

    const complianceDocs = [
        'B-BBEE Certificate.pdf', 
        'Tax Clearance.pdf', 
        'POPIA Policy.pdf', 
        'Company Profile.pdf'
    ];

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.95)' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', height: '600px', display: 'flex', flexDirection: 'column' }}>
                
                <div className="modal-header" style={{ paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Placeholder for the VSC Logo. Replace with /vsc-logo.png once added to public folder */}
                        <div style={{ width: '48px', height: '48px', background: 'var(--ubv-brand-gradient)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={24} color="white" />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ marginBottom: '2px' }}>{companyData.tradingName}</h2>
                            <p className="marker" style={{ fontSize: '12px' }}>Company Profile & Settings</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--ubv-border)', marginBottom: '24px' }}>
                    <button className={`text-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'details' ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: activeTab === 'details' ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}><Building2 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> Details</button>
                    <button className={`text-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'compliance' ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: activeTab === 'compliance' ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}><ShieldCheck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> Compliance</button>
                    <button className={`text-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'email' ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: activeTab === 'email' ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)' }}><Mail size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> Email Templates</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                    
                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* Company Identity */}
                            <div>
                                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--ubv-brand-gradient-start)', marginBottom: '12px', fontWeight: 600 }}>Company Identity</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Legal Name</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.legalName}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Trading Name</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.tradingName}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>VAT Number</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.vatNumber}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Registration Number</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.regNumber}</div></div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--ubv-brand-gradient-start)', marginBottom: '12px', fontWeight: 600 }}>Contact Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Physical Address</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.address}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Phone</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.phone}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Email</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.email}</div></div>
                                </div>
                            </div>

                            {/* Banking (Protected by capability in a real scenario) */}
                            <div>
                                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--ubv-brand-gradient-start)', marginBottom: '12px', fontWeight: 600 }}>Banking Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Bank Name</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.bankName}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Account No.</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.bankAccount}</div></div>
                                    <div><span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Branch Code</span><div style={{ fontSize: '14px', fontWeight: 500 }}>{companyData.bankBranch}</div></div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'compliance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p className="marker" style={{ marginBottom: '8px' }}>These documents are officially registered with the company and are accessible to all staff.</p>
                            {complianceDocs.map(doc => (
                                <div key={doc} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(128,128,128,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FileText size={20} color="var(--ubv-brand-gradient-start)" />
                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{doc}</span>
                                    </div>
                                    <button className="outline-btn" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Download size={14} /> Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p className="marker">System emails (such as meeting invites and invoices) are wrapped in the following branding.</p>
                            
                            <div className="glass-panel" style={{ padding: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email Header (HTML)</h4>
                                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--ubv-text-muted)', overflowX: 'auto' }}>
{`<div style="text-align: center; padding: 20px;">
  <img src="https://vscmining.co.za/logo.png" height="60" />
</div>`}
                                </pre>
                            </div>

                            <div className="glass-panel" style={{ padding: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email Footer (HTML)</h4>
                                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--ubv-text-muted)', overflowX: 'auto' }}>
{`<div style="text-align: center; font-size: 11px; color: #888; padding: 20px;">
  VSC Mining (Pty) Ltd. All rights reserved.<br/>
  This email was sent by Ubuveil MS.
</div>`}
                                </pre>
                            </div>
                            
                            <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--ubv-success)', background: 'rgba(43, 182, 115, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ubv-success)' }}>
                                    <CheckCircle2 size={16} />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Email delivery is active via Resend.</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--ubv-border)', paddingTop: '16px' }}>
                    <button className="outline-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}