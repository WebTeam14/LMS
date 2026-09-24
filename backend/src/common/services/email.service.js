import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from '../utils/logger.js';

let transporter = null;

/**
 * Initialize or get nodemailer transporter
 */
export const getTransporter = async () => {
  if (transporter) return transporter;

  // In production with configured SMTP credentials
  if (config.env === 'production' && config.email.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
    return transporter;
  }

  // In development/test, or when credentials are not supplied:
  // If SMTP user is set, try using it; otherwise create JSON/Ethereal transport
  if (config.email.smtp.user && config.email.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  } else {
    // Development fallback: simulated test transport that logs emails
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
    });
  }

  return transporter;
};

/**
 * Modern HTML email layout wrapper matching UniSphere branding
 */
const renderEmailTemplate = ({ title, preheader, content, callToAction }) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0c1527; padding: 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .logo-sub { color: #2dd4bf; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .body { padding: 36px 32px; }
    .h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .p { font-size: 14px; line-height: 24px; color: #475569; margin-bottom: 20px; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 16px 0; }
    .code-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 14px; color: #0f172a; word-break: break-all; margin: 16px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">UniSphere</div>
      <div class="logo-sub">University Digital Campus Platform</div>
    </div>
    <div class="body">
      <h1 class="h1">${title}</h1>
      <div class="p">${content}</div>
      ${callToAction ? `<div style="text-align: center;"><a href="${callToAction.url}" class="btn">${callToAction.text}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} UniSphere Digital Campus. All rights reserved.</p>
      <p>This is a secure automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Dispatch an email
 */
export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const mailClient = await getTransporter();
    const info = await mailClient.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });

    if (config.env !== 'production') {
      logger.info(`[EmailService] Dispatched email "${subject}" to ${to}`);
    }

    return info;
  } catch (error) {
    logger.error(`[EmailService] Failed to send email to ${to}: ${error.message}`);
    // Do not throw in development/testing to allow graceful operation
    if (config.env === 'production') throw error;
  }
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = `${config.email.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const title = 'Verify Your University Email';
  const content = `Hello ${name || 'Student/Faculty'},<br><br>
Welcome to UniSphere Digital Campus. Please verify your institutional email address to activate your full digital student/faculty workspace.
<br><br>
You can click the button below or copy the verification token directly:
<div class="code-box">${token}</div>`;

  const html = renderEmailTemplate({
    title,
    preheader: 'Verify your institutional email to activate campus privileges.',
    content,
    callToAction: {
      text: 'Verify Institutional Email',
      url: verificationUrl,
    },
  });

  return sendMail({
    to,
    subject: `[UniSphere] ${title}`,
    text: `Verify your email by visiting: ${verificationUrl}\nToken: ${token}`,
    html,
  });
};

/**
 * Send password reset link
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${config.email.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const title = 'Reset Your UniSphere Password';
  const content = `Hello ${name || 'User'},<br><br>
We received a request to reset your password for your UniSphere academic account. This link will expire in 1 hour.
<br><br>
If you did not request this password reset, please ignore this email or notify your campus IT security administrator.
<div class="code-box">${token}</div>`;

  const html = renderEmailTemplate({
    title,
    preheader: 'Password reset request for your digital campus account.',
    content,
    callToAction: {
      text: 'Set New Password',
      url: resetUrl,
    },
  });

  return sendMail({
    to,
    subject: `[UniSphere] ${title}`,
    text: `Reset your password by visiting: ${resetUrl}\nToken: ${token}`,
    html,
  });
};

/**
 * Send security notice on password change
 */
export const sendPasswordChangedEmail = async ({ to, name }) => {
  const title = 'Security Alert: Password Changed';
  const content = `Hello ${name || 'User'},<br><br>
The password for your UniSphere academic account was recently updated. All existing sessions have been terminated.
<br><br>
If you made this change, no further action is required. If you did NOT make this change, please contact your university security administrator immediately.`;

  const html = renderEmailTemplate({
    title,
    preheader: 'Your UniSphere password was changed.',
    content,
  });

  return sendMail({
    to,
    subject: `[UniSphere] ${title}`,
    text: `Your UniSphere account password has been changed. If this wasn't you, contact security.`,
    html,
  });
};

export default {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
