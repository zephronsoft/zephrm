import nodemailer from 'nodemailer';

type CredentialsMailInput = {
  email: string;
  fullName: string;
  password: string;
};

type GenericMailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const getSmtpHost = () => {
  return process.env.SMTP_HOST || '127.0.0.1';
};

const getSmtpPort = () => {
  const raw = process.env.SMTP_PORT;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 1025;
};

const getFromAddress = () => {
  const address = process.env.MAIL_FROM_ADDRESS || 'no-reply@hrm.local';
  const name = process.env.MAIL_FROM_NAME || 'HRM Pro';
  return `${name} <${address}>`;
};

const isSmtpEnabled = () => parseBoolean(process.env.SMTP_ENABLED, true);

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!isSmtpEnabled()) return null;
  if (transporter) return transporter;

  const hasAuth = !!process.env.SMTP_USER;
  transporter = nodemailer.createTransport({
    host: getSmtpHost(),
    port: getSmtpPort(),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    // When no credentials are set (internal relay), skip STARTTLS negotiation
    // entirely — the internal Postfix has no TLS certificate
    ignoreTLS: !hasAuth,
    auth: hasAuth
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        }
      : undefined,
  });

  return transporter;
};

const getLoginUrl = () => `${process.env.APP_BASE_URL || 'http://localhost'}/login`;

export const getSmtpStatus = () => ({
  enabled: isSmtpEnabled(),
  host: getSmtpHost(),
  port: getSmtpPort(),
  secure: parseBoolean(process.env.SMTP_SECURE, false),
  from: getFromAddress(),
});

export const sendGenericEmail = async ({ to, subject, text, html }: GenericMailInput) => {
  const smtp = getTransporter();
  if (!smtp) {
    return { sent: false, skipped: true, reason: 'SMTP is disabled' };
  }

  const hasText = !!String(text || '').trim();
  const hasHtml = !!String(html || '').trim();

  if (!hasText && !hasHtml) {
    throw new Error('Either text or html content is required');
  }

  const info = await smtp.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text: hasText ? text : undefined,
    html: hasHtml ? html : undefined,
  });

  return { sent: true, skipped: false, messageId: info.messageId };
};

export const sendNewJoinerCredentialsEmail = async ({ email, fullName, password }: CredentialsMailInput) => {
  const smtp = getTransporter();
  if (!smtp) {
    return { sent: false, skipped: true, reason: 'SMTP is disabled' };
  }

  const loginUrl = getLoginUrl();

  const info = await smtp.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Your HRM Pro account is ready',
    text: [
      `Hello ${fullName},`,
      '',
      'Your HRM Pro onboarding account has been created.',
      `Login URL: ${loginUrl}`,
      `Email: ${email}`,
      `Temporary Password: ${password}`,
      '',
      'Please sign in and complete your onboarding steps.',
    ].join('\n'),
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px">
        <h2 style="margin-bottom:12px">Welcome to HRM Pro</h2>
        <p>Hello ${fullName},</p>
        <p>Your onboarding account has been created. Use the credentials below to sign in and complete your onboarding steps.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
          <p style="margin:0"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>Please sign in and complete your onboarding process.</p>
      </div>
    `,
  });

  return { sent: true, skipped: false, messageId: info.messageId };
};