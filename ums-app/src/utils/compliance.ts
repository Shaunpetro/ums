// Path: ums-app/src/utils/compliance.ts
// Purpose: Compliance document families with version history and expiry helpers.

export interface ComplianceVersion {
    id: string;
    issued_date: string;
    expiry_date: string;
    file_key: string;
    uploaded_at: string;
    notes: string;
}

export interface ComplianceFamily {
    id: string;
    name: string;
    category: string;
    issued_by: string;
    renewal_cycle_months: number;
    versions: ComplianceVersion[];
}

export type ComplianceStatus = 'valid' | 'expiring' | 'expired';

export const COMPLIANCE_CATEGORIES = [
    { value: 'tax', label: 'Tax & SARS' },
    { value: 'bbbee', label: 'B-BBEE' },
    { value: 'safety', label: 'Safety & OHS' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'legal', label: 'Legal & Registration' },
    { value: 'other', label: 'Other' }
];

export const RENEWAL_CYCLES = [
    { value: 1, label: 'Monthly' },
    { value: 3, label: 'Quarterly' },
    { value: 6, label: 'Every 6 months' },
    { value: 12, label: 'Annually' },
    { value: 24, label: 'Every 2 years' },
    { value: 36, label: 'Every 3 years' }
];

export function getCurrentVersion(family: ComplianceFamily): ComplianceVersion | null {
    if (!family.versions || family.versions.length === 0) return null;
    const sorted = [...family.versions].sort((a, b) => {
        const da = new Date(a.issued_date).getTime() || 0;
        const db = new Date(b.issued_date).getTime() || 0;
        if (da !== db) return db - da;
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });
    return sorted[0];
}

export function getComplianceStatus(family: ComplianceFamily): ComplianceStatus {
    const current = getCurrentVersion(family);
    if (!current || !current.expiry_date) return 'valid';
    const expiry = new Date(current.expiry_date);
    if (isNaN(expiry.getTime())) return 'valid';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'valid';
}

export function daysUntilExpiry(family: ComplianceFamily): number | null {
    const current = getCurrentVersion(family);
    if (!current || !current.expiry_date) return null;
    const expiry = new Date(current.expiry_date);
    if (isNaN(expiry.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
}

export function statusLabel(family: ComplianceFamily): string {
    const status = getComplianceStatus(family);
    if (status === 'valid') return 'Valid';
    if (status === 'expired') {
        const days = daysUntilExpiry(family);
        return days !== null ? `Expired ${Math.abs(days)}d ago` : 'Expired';
    }
    const days = daysUntilExpiry(family);
    return days === 0 ? 'Expires today' : `Expires in ${days}d`;
}

export function suggestExpiryDate(issuedDate: string, cycleMonths: number): string {
    if (!issuedDate) return '';
    const d = new Date(issuedDate);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + cycleMonths);
    return d.toISOString().slice(0, 10);
}

// Migration: convert a legacy ComplianceDoc (single snapshot) into a family
// with one version. Idempotent - families pass through unchanged.
export function migrateLegacyDoc(raw: any): ComplianceFamily {
    if (raw && Array.isArray(raw.versions)) return raw as ComplianceFamily;
    return {
        id: raw.id || `fam-${Date.now()}`,
        name: raw.name || '',
        category: raw.category || 'other',
        issued_by: raw.issued_by || '',
        renewal_cycle_months: 12,
        versions: [{
            id: raw.id || `v-${Date.now()}`,
            issued_date: raw.issued_date || '',
            expiry_date: raw.expiry_date || '',
            file_key: raw.file_key || '',
            uploaded_at: new Date().toISOString(),
            notes: raw.notes || ''
        }]
    };
}