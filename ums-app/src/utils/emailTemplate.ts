// Path: ums-app/src/utils/emailTemplate.ts
// Purpose: Types and HTML compiler for the structured email template schema.

export interface EmailTemplate {
    header: {
        logo_url: string;
        tagline: string;
        background_color: string;
        text_color: string;
    };
    banner: {
        image_url: string;
        headline: string;
        subtext: string;
        button_text: string;
        button_url: string;
        background_color: string;
    };
    body: {
        content: string;
    };
    signature: {
        content: string;
    };
    footer: {
        company_name: string;
        address: string;
        phone: string;
        email: string;
        unsubscribe_url: string;
    };
}

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplate = {
    header: {
        logo_url: '',
        tagline: 'Ubuveil Management System',
        background_color: '#17151a',
        text_color: '#e8e4dd'
    },
    banner: {
        image_url: '',
        headline: '',
        subtext: '',
        button_text: '',
        button_url: '',
        background_color: '#EB6F65'
    },
    body: { content: '' },
    signature: { content: '' },
    footer: {
        company_name: '',
        address: '',
        phone: '',
        email: '',
        unsubscribe_url: ''
    }
};

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function textToHtml(text: string): string {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .split(/\n{2,}/)
        .map(para => `<p style="margin:0 0 12px 0;">${para.replace(/\n/g, '<br/>')}</p>`)
        .join('');
}

export function compileEmailTemplate(t: EmailTemplate): string {
    const header = `
    <tr><td style="background:${t.header.background_color};padding:24px;text-align:center;">
      ${t.header.logo_url ? `<img src="${t.header.logo_url}" height="48" alt="Logo" style="display:inline-block;"/>` : ''}
      ${t.header.tagline ? `<div style="color:${t.header.text_color};margin-top:10px;font-size:12px;letter-spacing:0.5px;">${escapeHtml(t.header.tagline)}</div>` : ''}
    </td></tr>`;

    const bannerHasContent = t.banner.image_url || t.banner.headline || t.banner.subtext || t.banner.button_text;
    const banner = bannerHasContent ? `
    <tr><td style="background:${t.banner.background_color};padding:40px 24px;text-align:center;">
      ${t.banner.image_url ? `<img src="${t.banner.image_url}" alt="Banner" style="max-width:100%;display:block;margin:0 auto 16px;"/>` : ''}
      ${t.banner.headline ? `<h1 style="color:#ffffff;margin:0 0 12px 0;font-size:24px;font-weight:600;">${escapeHtml(t.banner.headline)}</h1>` : ''}
      ${t.banner.subtext ? `<p style="color:#ffffff;opacity:0.92;margin:0 0 20px 0;font-size:14px;line-height:1.5;">${escapeHtml(t.banner.subtext)}</p>` : ''}
      ${t.banner.button_text ? `<a href="${escapeHtml(t.banner.button_url || '#')}" style="display:inline-block;background:#ffffff;color:${t.banner.background_color};padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${escapeHtml(t.banner.button_text)}</a>` : ''}
    </td></tr>` : '';

    const body = t.body.content ? `
    <tr><td style="padding:32px 40px;color:#333333;font-size:14px;line-height:1.65;">
      ${textToHtml(t.body.content)}
    </td></tr>` : '';

    const signature = t.signature.content ? `
    <tr><td style="padding:0 40px 32px;color:#333333;font-size:14px;line-height:1.65;">
      ${textToHtml(t.signature.content)}
    </td></tr>` : '';

    const footerLines: string[] = [];
    if (t.footer.company_name) footerLines.push(`<div style="font-weight:600;color:#555;margin-bottom:4px;">${escapeHtml(t.footer.company_name)}</div>`);
    if (t.footer.address) footerLines.push(`<div>${escapeHtml(t.footer.address)}</div>`);
    const contactBits = [t.footer.phone, t.footer.email].filter(Boolean).map(escapeHtml).join(' | ');
    if (contactBits) footerLines.push(`<div>${contactBits}</div>`);
    if (t.footer.unsubscribe_url) footerLines.push(`<div style="margin-top:10px;"><a href="${escapeHtml(t.footer.unsubscribe_url)}" style="color:#888;text-decoration:underline;">Unsubscribe</a></div>`);

    const footer = footerLines.length > 0 ? `
    <tr><td style="background:#f9f9f9;padding:24px 40px;text-align:center;color:#888888;font-size:11px;line-height:1.6;">
      ${footerLines.join('')}
    </td></tr>` : '';

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eae7e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eae7e1;">
  <tr><td align="center" style="padding:24px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      ${header}
      ${banner}
      ${body}
      ${signature}
      ${footer}
    </table>
  </td></tr>
</table>
</body></html>`;
}