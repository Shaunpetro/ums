// Path: ums-app/src/types/company.ts
// Purpose: Shared company profile types (Stage 05: compliance families).

import { ComplianceFamily } from '../utils/compliance';
import { EmailTemplate, DEFAULT_EMAIL_TEMPLATE } from '../utils/emailTemplate';

export interface CompanyIdentity {
    legal_name: string;
    trading_name: string;
    vat_number: string;
    reg_number: string;
    address: string;
    phone: string;
    email: string;
}

export interface BankingDetails {
    account_holder: string;
    bank_name: string;
    account_number: string;
    account_type: string;
    branch_code: string;
    swift_code: string;
    currency: string;
}

export interface Branding {
    logo_light_url: string;
    logo_dark_url: string;
}

export interface CompanyProfile {
    identity: CompanyIdentity;
    banking: BankingDetails;
    branding: Branding;
    compliance_docs: ComplianceFamily[];
    email_template: EmailTemplate;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
    identity: {
        legal_name: '',
        trading_name: '',
        vat_number: '',
        reg_number: '',
        address: '',
        phone: '',
        email: ''
    },
    banking: {
        account_holder: '',
        bank_name: '',
        account_number: '',
        account_type: 'Cheque',
        branch_code: '',
        swift_code: '',
        currency: 'ZAR'
    },
    branding: {
        logo_light_url: '/logo-horizontal-color.svg',
        logo_dark_url: '/logo-horizontal-white.svg'
    },
    compliance_docs: [],
    email_template: { ...DEFAULT_EMAIL_TEMPLATE }
};