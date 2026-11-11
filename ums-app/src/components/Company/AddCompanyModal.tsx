// Path: ums-app/src/components/Company/AddCompanyModal.tsx
// Purpose: Placeholder modal for adding a new company.

import { X, Building2, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
    onClose: () => void;
}

export default function AddCompanyModal({ onClose }: Props) {
    const { toast } = useToast();

    return (
        <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(23, 21, 26, 0.95)' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Add Workspace</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--ubv-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={32} color="var(--ubv-brand-gradient-start)" />
                    </div>
                </div>

                <p className="marker" style={{ textAlign: 'center', marginBottom: '24px' }}>
                    Enter the domain of the company you want to join. Your account must be associated with this company.
                </p>

                <div className="form-group">
                    <label>Company Domain</label>
                    <input type="text" className="form-input" placeholder="e.g. vscmining.co.za" autoFocus />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="outline-btn" onClick={onClose}>Cancel</button>
                    <button className="action-btn" onClick={() => { toast('Company requests are handled by Autentico. (Coming Soon)', 'info'); onClose(); }}>
                        <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> Add Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}