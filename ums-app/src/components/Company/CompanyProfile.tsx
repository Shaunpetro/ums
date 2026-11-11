// Path: ums-app/src/components/Company/CompanyProfile.tsx
// Purpose: S3-backed company profile with versioned compliance workflow.

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Building2, ShieldCheck, Mail, Save, Loader2, Plus, Trash2, Upload, Download, CheckCircle2, AlertTriangle, Clock, History, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { CompanyProfile as CompanyProfileType, DEFAULT_COMPANY_PROFILE } from '../../types/company';
import {
    ComplianceFamily, ComplianceVersion, COMPLIANCE_CATEGORIES, RENEWAL_CYCLES,
    getCurrentVersion, getComplianceStatus, statusLabel,
    suggestExpiryDate, migrateLegacyDoc
} from '../../utils/compliance';
import { EmailTemplate, DEFAULT_EMAIL_TEMPLATE, compileEmailTemplate } from '../../utils/emailTemplate';
import { open } from '@tauri-apps/plugin-dialog';

interface Props { onClose: () => void; }

export default function CompanyProfile({ onClose }: Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'details' | 'compliance' | 'email'>('details');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<CompanyProfileType>(DEFAULT_COMPANY_PROFILE);

    const orgId = (user?.org || '').replace(/ /g, '_');

    useEffect(() => {
        if (!orgId) return;
        invoke<string>('get_company_profile', { orgId })
            .then(raw => {
                if (raw && raw !== '{}') {
                    try {
                        const parsed = JSON.parse(raw);
                        const rawDocs = parsed.compliance_docs || [];
                        const migratedDocs: ComplianceFamily[] = rawDocs.map(migrateLegacyDoc);
                        setProfile({
                            identity: parsed.identity || DEFAULT_COMPANY_PROFILE.identity,
                            banking: parsed.banking || DEFAULT_COMPANY_PROFILE.banking,
                            branding: parsed.branding || DEFAULT_COMPANY_PROFILE.branding,
                            compliance_docs: migratedDocs,
                            email_template: parsed.email_template || DEFAULT_EMAIL_TEMPLATE
                        });
                    } catch (e) {
                        console.error('Failed to parse company profile:', e);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [orgId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await invoke('save_company_profile', { orgId, profileJson: JSON.stringify(profile, null, 2) });
            toast('Company profile saved.', 'success');
        } catch (err) {
            toast(`Save failed: ${err}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const updateIdentity = (field: keyof CompanyProfileType['identity'], value: string) => {
        setProfile(p => ({ ...p, identity: { ...p.identity, [field]: value } }));
    };
    const updateBanking = (field: keyof CompanyProfileType['banking'], value: string) => {
        setProfile(p => ({ ...p, banking: { ...p.banking, [field]: value } }));
    };
    const updateCompliance = (docs: ComplianceFamily[]) => {
        setProfile(p => ({ ...p, compliance_docs: docs }));
    };
    const updateEmailTemplate = (template: EmailTemplate) => {
        setProfile(p => ({ ...p, email_template: template }));
    };

    const canEdit = user?.capabilities?.includes('admin:profile') ?? false;
    const canEditBanking = canEdit || (user?.capabilities?.includes('admin:finance') ?? false);

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.95)' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '1100px', width: '95vw', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header" style={{ paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'var(--ubv-brand-gradient)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={24} color="white" />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ marginBottom: '2px' }}>{profile.identity.trading_name || user?.org || 'Company Profile'}</h2>
                            <p className="marker" style={{ fontSize: '12px' }}>Company Profile & Settings</p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--ubv-border)', marginBottom: '24px' }}>
                    <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')} icon={<Building2 size={16} />} label="Details" />
                    <TabButton active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} icon={<ShieldCheck size={16} />} label="Compliance" />
                    <TabButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} icon={<Mail size={16} />} label="Email Templates" />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader2 className="spin" size={32} />
                        </div>
                    ) : activeTab === 'details' ? (
                        <DetailsTab
                            profile={profile}
                            canEdit={canEdit}
                            canEditBanking={canEditBanking}
                            updateIdentity={updateIdentity}
                            updateBanking={updateBanking}
                            orgId={orgId}
                            setProfile={setProfile}
                            toast={toast}
                        />
                    ) : activeTab === 'compliance' ? (
                        <ComplianceTab
                            families={profile.compliance_docs}
                            canEdit={canEdit}
                            onChange={updateCompliance}
                            orgId={orgId}
                            toast={toast}
                        />
                    ) : (
                        <EmailTemplateTab
                            template={profile.email_template}
                            canEdit={canEdit}
                            onChange={updateEmailTemplate}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--ubv-border)', paddingTop: '16px' }}>
                    <button className="outline-btn" onClick={onClose}>Close</button>
                    {(canEdit || canEditBanking) && (
                        <button className="action-btn" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button className={`text-btn ${active ? 'active' : ''}`} onClick={onClick} style={{ paddingBottom: '12px', borderBottom: active ? '2px solid var(--ubv-brand-gradient-start)' : 'none', color: active ? 'var(--ubv-text-main)' : 'var(--ubv-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {icon} {label}
        </button>
    );
}

// ============ DETAILS TAB (unchanged) ============

function DetailsTab({ profile, canEdit, canEditBanking, updateIdentity, updateBanking, orgId, setProfile, toast }: any) {
    const [uploadingLight, setUploadingLight] = useState(false);
    const [uploadingDark, setUploadingDark] = useState(false);

    const handleLogoUpload = async (variant: 'light' | 'dark') => {
        try {
            const selected = await open({ multiple: false, title: `Select ${variant} logo`, filters: [{ name: 'Images', extensions: ['svg', 'png', 'jpg', 'jpeg'] }] });
            if (!selected || typeof selected !== 'string') return;
            if (variant === 'light') setUploadingLight(true); else setUploadingDark(true);
            const filename = selected.split(/[\\/]/).pop() || 'logo';
            const ext = filename.split('.').pop() || 'png';
            const key = `${orgId}/branding/logo-${variant}.${ext}`;
            await invoke('upload_compliance_doc', { orgId, docId: `logo-${variant}`, localPath: selected, filename });
            setProfile((p: any) => ({ ...p, branding: { ...p.branding, [variant === 'light' ? 'logo_light_url' : 'logo_dark_url']: key } }));
            toast(`${variant} logo uploaded.`, 'success');
        } catch (err) {
            toast(`Logo upload failed: ${err}`, 'error');
        } finally {
            if (variant === 'light') setUploadingLight(false); else setUploadingDark(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Section title="Company Identity">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Field label="Legal Name" value={profile.identity.legal_name} onChange={v => updateIdentity('legal_name', v)} disabled={!canEdit} />
                    <Field label="Trading Name" value={profile.identity.trading_name} onChange={v => updateIdentity('trading_name', v)} disabled={!canEdit} />
                    <Field label="VAT Number" value={profile.identity.vat_number} onChange={v => updateIdentity('vat_number', v)} disabled={!canEdit} />
                    <Field label="Registration Number" value={profile.identity.reg_number} onChange={v => updateIdentity('reg_number', v)} disabled={!canEdit} />
                </div>
            </Section>
            <Section title="Contact Information">
                <Field label="Physical Address" value={profile.identity.address} onChange={v => updateIdentity('address', v)} disabled={!canEdit} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <Field label="Phone" value={profile.identity.phone} onChange={v => updateIdentity('phone', v)} disabled={!canEdit} />
                    <Field label="Email" value={profile.identity.email} onChange={v => updateIdentity('email', v)} disabled={!canEdit} />
                </div>
            </Section>
            <Section title="Branding">
                <p className="marker" style={{ fontSize: '12px', marginBottom: '16px' }}>Light and dark variants are used in the app chrome and in outgoing emails.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Light Mode Logo</span>
                        <div className="glass-panel" style={{ padding: '16px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{ flex: 1, fontSize: '12px', color: 'var(--ubv-text-muted)', wordBreak: 'break-all' }}>{profile.branding.logo_light_url || 'Not set'}</div>
                            {canEdit && <button className="outline-btn" onClick={() => handleLogoUpload('light')} disabled={uploadingLight} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Upload size={12} /> {uploadingLight ? '...' : 'Upload'}</button>}
                        </div>
                    </div>
                    <div>
                        <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Dark Mode Logo</span>
                        <div className="glass-panel" style={{ padding: '16px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ flex: 1, fontSize: '12px', color: 'var(--ubv-text-muted)', wordBreak: 'break-all' }}>{profile.branding.logo_dark_url || 'Not set'}</div>
                            {canEdit && <button className="outline-btn" onClick={() => handleLogoUpload('dark')} disabled={uploadingDark} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Upload size={12} /> {uploadingDark ? '...' : 'Upload'}</button>}
                        </div>
                    </div>
                </div>
            </Section>
            <Section title="Banking Details">
                <p className="marker" style={{ fontSize: '12px', marginBottom: '16px' }}>Used in invoices and outgoing emails. Only finance-capable users can edit this section.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Field label="Account Holder" value={profile.banking.account_holder} onChange={v => updateBanking('account_holder', v)} disabled={!canEditBanking} />
                    <Field label="Bank Name" value={profile.banking.bank_name} onChange={v => updateBanking('bank_name', v)} disabled={!canEditBanking} />
                    <Field label="Account Number" value={profile.banking.account_number} onChange={v => updateBanking('account_number', v)} disabled={!canEditBanking} />
                    <div className="form-group">
                        <label>Account Type</label>
                        <select className="form-input" value={profile.banking.account_type} onChange={e => updateBanking('account_type', e.target.value)} disabled={!canEditBanking}>
                            <option value="Cheque">Cheque / Current</option>
                            <option value="Savings">Savings</option>
                            <option value="Business">Business</option>
                            <option value="Transmission">Transmission</option>
                        </select>
                    </div>
                    <Field label="Branch Code" value={profile.banking.branch_code} onChange={v => updateBanking('branch_code', v)} disabled={!canEditBanking} />
                    <Field label="SWIFT Code" value={profile.banking.swift_code} onChange={v => updateBanking('swift_code', v)} disabled={!canEditBanking} />
                    <Field label="Currency" value={profile.banking.currency} onChange={v => updateBanking('currency', v)} disabled={!canEditBanking} />
                </div>
            </Section>
        </div>
    );
}

// ============ COMPLIANCE TAB (versioned families) ============

function ComplianceTab({ families, canEdit, onChange, orgId, toast }: { families: ComplianceFamily[]; canEdit: boolean; onChange: (f: ComplianceFamily[]) => void; orgId: string; toast: any }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [addingFamily, setAddingFamily] = useState(false);
    const [addingVersionTo, setAddingVersionTo] = useState<string | null>(null);

    const handleAddFamily = (family: ComplianceFamily) => {
        onChange([...families, family]);
        setAddingFamily(false);
    };
    const handleDeleteFamily = (id: string) => {
        if (!window.confirm('Delete this document and all its renewal history? This cannot be undone.')) return;
        onChange(families.filter(f => f.id !== id));
    };
    const handleAddVersion = (familyId: string, version: ComplianceVersion) => {
        onChange(families.map(f => f.id === familyId ? { ...f, versions: [...f.versions, version] } : f));
        setAddingVersionTo(null);
    };
    const handleDeleteVersion = (familyId: string, versionId: string) => {
        if (!window.confirm('Delete this certificate version? Older versions are kept for audit.')) return;
        const family = families.find(f => f.id === familyId);
        if (!family) return;
        if (family.versions.length === 1) {
            toast('Cannot delete the only version. Delete the whole document instead.', 'error');
            return;
        }
        onChange(families.map(f => f.id === familyId ? { ...f, versions: f.versions.filter(v => v.id !== versionId) } : f));
    };

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
                <p className="marker" style={{ fontSize: '12px' }}>
                    One row per document type. When you renew, add a new certificate to the existing document - the previous one is kept for audit.
                </p>
                {canEdit && !addingFamily && (
                    <button className="action-btn" onClick={() => setAddingFamily(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
                        <Plus size={14} /> Add Document
                    </button>
                )}
            </div>

            {addingFamily && (
                <FamilyForm
                    orgId={orgId}
                    onSave={handleAddFamily}
                    onCancel={() => setAddingFamily(false)}
                    toast={toast}
                />
            )}

            {families.length === 0 && !addingFamily ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                    <ShieldCheck size={48} color="var(--ubv-text-muted)" style={{ marginBottom: '12px' }} />
                    <p className="marker">No compliance documents tracked yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {families.map(family => {
                        const current = getCurrentVersion(family);
                        const status = getComplianceStatus(family);
                        const label = statusLabel(family);
                        const badgeClass = status === 'expired' ? 'danger' : status === 'expiring' ? 'warning' : 'success';
                        const Icon = status === 'expired' ? AlertTriangle : status === 'expiring' ? Clock : CheckCircle2;
                        const isExpanded = expandedId === family.id;

                        return (
                            <div key={family.id} className="glass-panel" style={{ background: 'rgba(128,128,128,0.05)' }}>
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : family.id)}
                                    style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        <Icon size={20} color={status === 'expired' ? 'var(--ubv-danger)' : status === 'expiring' ? 'var(--ubv-warning)' : 'var(--ubv-success)'} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{family.name}</div>
                                            <div className="marker" style={{ fontSize: '11px' }}>
                                                {current ? `Current: issued ${current.issued_date}, expires ${current.expiry_date}` : 'No versions'}
                                                {family.versions.length > 1 && ` - ${family.versions.length} versions`}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className={`badge ${badgeClass}`} style={{ fontSize: '11px' }}>{label}</span>
                                        <History size={14} color="var(--ubv-text-muted)" />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid var(--ubv-border)', padding: '16px' }}>
                                        <div className="flex-between" style={{ marginBottom: '12px' }}>
                                            <span className="marker" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Version History</span>
                                            {canEdit && (
                                                <button className="outline-btn" onClick={() => setAddingVersionTo(family.id)} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <RotateCcw size={12} /> Renew
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {[...family.versions]
                                                .sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime())
                                                .map(v => {
                                                    const isCurrent = v.id === current?.id;
                                                    return (
                                                        <div key={v.id} className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCurrent ? 'rgba(43,182,115,0.08)' : 'rgba(0,0,0,0.15)', border: isCurrent ? '1px solid var(--ubv-success)' : '1px solid var(--ubv-border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                                {isCurrent && <CheckCircle2 size={14} color="var(--ubv-success)" />}
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                                                        Issued {v.issued_date} → Expires {v.expiry_date}
                                                                        {isCurrent && <span className="badge success" style={{ fontSize: '10px', marginLeft: '8px' }}>CURRENT</span>}
                                                                    </div>
                                                                    <div className="marker" style={{ fontSize: '11px' }}>
                                                                        Uploaded {new Date(v.uploaded_at).toLocaleDateString()}
                                                                        {v.notes && ` - ${v.notes}`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {v.file_key && (
                                                                    <button className="icon-btn" onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            const path = await invoke<string>('download_file', { key: v.file_key });
                                                                            toast(`Downloaded to ${path}`, 'success');
                                                                        } catch (err) { toast(`Download failed: ${err}`, 'error'); }
                                                                    }} title="Download"><Download size={14} /></button>
                                                                )}
                                                                {canEdit && !isCurrent && (
                                                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteVersion(family.id, v.id); }} style={{ color: 'var(--ubv-danger)' }} title="Delete version"><Trash2 size={14} /></button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        {canEdit && (
                                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button className="text-btn" onClick={() => handleDeleteFamily(family.id)} style={{ fontSize: '11px', color: 'var(--ubv-danger)' }}>
                                                    Delete this document entirely
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {addingVersionTo === family.id && (
                                    <div style={{ borderTop: '1px solid var(--ubv-border)', padding: '16px' }}>
                                        <VersionForm
                                            orgId={orgId}
                                            family={family}
                                            onSave={(v: ComplianceVersion) => handleAddVersion(family.id, v)}
                                            onCancel={() => setAddingVersionTo(null)}
                                            toast={toast}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FamilyForm({ orgId, onSave, onCancel, toast }: any) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('other');
    const [issuedBy, setIssuedBy] = useState('');
    const [cycle, setCycle] = useState(12);
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
    const [expiryDate, setExpiryDate] = useState(suggestExpiryDate(new Date().toISOString().slice(0, 10), 12));
    const [filePath, setFilePath] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleCycleChange = (c: number) => {
        setCycle(c);
        setExpiryDate(suggestExpiryDate(issuedDate, c));
    };
    const handleIssuedDateChange = (d: string) => {
        setIssuedDate(d);
        setExpiryDate(suggestExpiryDate(d, cycle));
    };
    const handlePickFile = async () => {
        const selected = await open({ multiple: false, title: 'Select document' });
        if (selected && typeof selected === 'string') setFilePath(selected);
    };
    const handleSave = async () => {
        if (!name.trim()) { toast('Name is required.', 'error'); return; }
        if (!expiryDate) { toast('Expiry date is required.', 'error'); return; }
        setSaving(true);
        try {
            const familyId = `fam-${Date.now()}`;
            const versionId = `v-${Date.now()}`;
            let fileKey = '';
            if (filePath) {
                const filename = filePath.split(/[\\/]/).pop() || 'document';
                fileKey = await invoke<string>('upload_compliance_doc', { orgId, docId: `${familyId}-${versionId}`, localPath: filePath, filename });
            }
            onSave({
                id: familyId,
                name: name.trim(),
                category,
                issued_by: issuedBy.trim(),
                renewal_cycle_months: cycle,
                versions: [{
                    id: versionId,
                    issued_date: issuedDate,
                    expiry_date: expiryDate,
                    file_key: fileKey,
                    uploaded_at: new Date().toISOString(),
                    notes: notes.trim()
                }]
            } as ComplianceFamily);
        } catch (err) {
            toast(`Upload failed: ${err}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--ubv-brand-gradient-start)', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Document Name" value={name} onChange={setName} />
                <div className="form-group">
                    <label>Category</label>
                    <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                        {COMPLIANCE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <Field label="Issued By" value={issuedBy} onChange={setIssuedBy} />
                <div className="form-group">
                    <label>Renewal Cycle</label>
                    <select className="form-input" value={cycle} onChange={e => handleCycleChange(Number(e.target.value))}>
                        {RENEWAL_CYCLES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <Field label="Issued Date" type="date" value={issuedDate} onChange={handleIssuedDateChange} />
                <Field label="Expiry Date (auto-filled, editable)" type="date" value={expiryDate} onChange={setExpiryDate} />
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>File</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="outline-btn" onClick={handlePickFile} style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={12} /> {filePath ? 'Replace' : 'Choose File'}
                        </button>
                        <span className="marker" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                            {filePath ? filePath.split(/[\\/]/).pop() : 'No file selected'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Notes</label>
                <textarea className="form-input" style={{ height: '60px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="outline-btn" onClick={onCancel} style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button className="action-btn" onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {saving ? 'Saving...' : 'Add Document'}
                </button>
            </div>
        </div>
    );
}

function VersionForm({ orgId, family, onSave, onCancel, toast }: any) {
    const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
    const [expiryDate, setExpiryDate] = useState(suggestExpiryDate(new Date().toISOString().slice(0, 10), family.renewal_cycle_months || 12));
    const [filePath, setFilePath] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleIssuedChange = (d: string) => {
        setIssuedDate(d);
        setExpiryDate(suggestExpiryDate(d, family.renewal_cycle_months || 12));
    };
    const handlePickFile = async () => {
        const selected = await open({ multiple: false, title: 'Select renewed certificate' });
        if (selected && typeof selected === 'string') setFilePath(selected);
    };
    const handleSave = async () => {
        if (!expiryDate) { toast('Expiry date is required.', 'error'); return; }
        setSaving(true);
        try {
            const versionId = `v-${Date.now()}`;
            let fileKey = '';
            if (filePath) {
                const filename = filePath.split(/[\\/]/).pop() || 'document';
                fileKey = await invoke<string>('upload_compliance_doc', { orgId, docId: `${family.id}-${versionId}`, localPath: filePath, filename });
            }
            onSave({
                id: versionId,
                issued_date: issuedDate,
                expiry_date: expiryDate,
                file_key: fileKey,
                uploaded_at: new Date().toISOString(),
                notes: notes.trim()
            } as ComplianceVersion);
        } catch (err) {
            toast(`Upload failed: ${err}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
            <p className="marker" style={{ fontSize: '11px', marginBottom: '12px' }}>
                Add the renewed certificate for <strong>{family.name}</strong>. The previous version stays in the history above.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Issued Date" type="date" value={issuedDate} onChange={handleIssuedChange} />
                <Field label="Expiry Date (auto-filled)" type="date" value={expiryDate} onChange={setExpiryDate} />
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>File</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="outline-btn" onClick={handlePickFile} style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Upload size={12} /> {filePath ? 'Replace' : 'Choose File'}
                        </button>
                        <span className="marker" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                            {filePath ? filePath.split(/[\\/]/).pop() : 'No file selected'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Notes</label>
                <textarea className="form-input" style={{ height: '50px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Signed by SARS East Rand office" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="outline-btn" onClick={onCancel} style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button className="action-btn" onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {saving ? 'Saving...' : 'Add Renewal'}
                </button>
            </div>
        </div>
    );
}

// ============ EMAIL TEMPLATE TAB (unchanged) ============

function EmailTemplateTab({ template, canEdit, onChange }: { template: EmailTemplate; canEdit: boolean; onChange: (t: EmailTemplate) => void }) {
    const updateSection = <K extends keyof EmailTemplate>(section: K, field: keyof EmailTemplate[K], value: string) => {
        onChange({ ...template, [section]: { ...template[section], [field]: value } });
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', minHeight: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Section title="Header">
                    <Field label="Logo URL (or S3 key)" value={template.header.logo_url} onChange={v => updateSection('header', 'logo_url', v)} disabled={!canEdit} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <Field label="Tagline" value={template.header.tagline} onChange={v => updateSection('header', 'tagline', v)} disabled={!canEdit} />
                        <Field label="Background Color (hex)" value={template.header.background_color} onChange={v => updateSection('header', 'background_color', v)} disabled={!canEdit} />
                    </div>
                </Section>
                <Section title="Hero Banner">
                    <Field label="Banner Image URL" value={template.banner.image_url} onChange={v => updateSection('banner', 'image_url', v)} disabled={!canEdit} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <Field label="Headline" value={template.banner.headline} onChange={v => updateSection('banner', 'headline', v)} disabled={!canEdit} />
                        <Field label="Background Color (hex)" value={template.banner.background_color} onChange={v => updateSection('banner', 'background_color', v)} disabled={!canEdit} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <Field label="Subtext" value={template.banner.subtext} onChange={v => updateSection('banner', 'subtext', v)} disabled={!canEdit} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <Field label="Button Text" value={template.banner.button_text} onChange={v => updateSection('banner', 'button_text', v)} disabled={!canEdit} />
                        <Field label="Button URL" value={template.banner.button_url} onChange={v => updateSection('banner', 'button_url', v)} disabled={!canEdit} />
                    </div>
                </Section>
                <Section title="Body">
                    <p className="marker" style={{ fontSize: '11px', marginBottom: '8px' }}>Supports **bold** and *italic*. Blank line starts a new paragraph.</p>
                    <textarea className="form-input" style={{ height: '140px', resize: 'vertical', fontFamily: 'inherit' }} value={template.body.content} onChange={e => updateSection('body', 'content', e.target.value)} disabled={!canEdit} />
                </Section>
                <Section title="Signature">
                    <textarea className="form-input" style={{ height: '80px', resize: 'vertical', fontFamily: 'inherit' }} value={template.signature.content} onChange={e => updateSection('signature', 'content', e.target.value)} disabled={!canEdit} />
                </Section>
                <Section title="Footer">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Field label="Company Name" value={template.footer.company_name} onChange={v => updateSection('footer', 'company_name', v)} disabled={!canEdit} />
                        <Field label="Phone" value={template.footer.phone} onChange={v => updateSection('footer', 'phone', v)} disabled={!canEdit} />
                        <Field label="Email" value={template.footer.email} onChange={v => updateSection('footer', 'email', v)} disabled={!canEdit} />
                        <Field label="Unsubscribe URL" value={template.footer.unsubscribe_url} onChange={v => updateSection('footer', 'unsubscribe_url', v)} disabled={!canEdit} />
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <Field label="Address" value={template.footer.address} onChange={v => updateSection('footer', 'address', v)} disabled={!canEdit} />
                    </div>
                </Section>
            </div>
            <div style={{ position: 'sticky', top: 0, height: 'fit-content' }}>
                <Section title="Live Preview">
                    <iframe title="Email preview" srcDoc={compileEmailTemplate(template)} style={{ width: '100%', height: '600px', border: '1px solid var(--ubv-border)', borderRadius: '8px', background: '#ffffff' }} sandbox="allow-same-origin" />
                </Section>
            </div>
        </div>
    );
}

// ============ SHARED PRIMITIVES ============

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ubv-brand-gradient-start)', marginBottom: '12px', fontWeight: 600 }}>{title}</h3>
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(128,128,128,0.03)' }}>{children}</div>
        </div>
    );
}

function Field({ label, value, onChange, disabled, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string }) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <input type={type} className="form-input" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} />
        </div>
    );
}