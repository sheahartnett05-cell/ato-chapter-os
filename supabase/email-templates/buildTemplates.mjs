/**
 * Agora-branded Supabase Auth email templates.
 * Colors/fonts match src/index.css + onboarding editorial aesthetic.
 */

const C = {
  primary: '#1a1a1a',
  accent: '#c4a35a',
  surface: '#f4f2ee',
  card: '#faf9f7',
  ink: '#141414',
  muted: '#6b6b6b',
  rule: '#e0ddd6',
  white: '#ffffff',
}

const PRODUCT_NAME = 'Agora'
const TAGLINE = 'Greek org management platform'

function layout({ preheader, title, body, ctaLabel, ctaHref, token, footerNote }) {
  const tokenBlock = token
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td align="center" style="background:${C.card};border:1px solid ${C.rule};border-radius:4px;padding:20px 16px;"><p style="margin:0 0 8px;font-family:'JetBrains Mono',Consolas,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};">Login code</p><p style="margin:0;font-family:'JetBrains Mono',Consolas,monospace;font-size:32px;font-weight:600;letter-spacing:0.28em;color:${C.ink};">${token}</p></td></tr></table>`
    : ''

  const ctaBlock =
    ctaLabel && ctaHref
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td align="center" style="border-radius:4px;background:${C.primary};"><a href="${ctaHref}" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;color:${C.white};text-decoration:none;">${ctaLabel}</a></td></tr></table>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.surface};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border:1px solid ${C.rule};border-radius:4px;overflow:hidden;">
<tr><td style="height:3px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="background:${C.primary};padding:28px 32px 24px;">
<h1 style="margin:0;font-family:Georgia,'Libre Baskerville','Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${C.white};">${PRODUCT_NAME}</h1>
<p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.72);">${TAGLINE}</p>
<p style="margin:16px 0 0;font-family:Georgia,'Libre Baskerville','Times New Roman',serif;font-size:18px;line-height:1.3;font-weight:700;color:${C.white};">${title}</p>
</td></tr>
<tr><td style="padding:32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${body}${tokenBlock}${ctaBlock}
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${C.muted};">${footerNote ?? 'If you did not request this, you can safely ignore this email.'}</p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid ${C.rule};">
<p style="margin:0;font-family:'JetBrains Mono',Consolas,monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">${PRODUCT_NAME} · ${TAGLINE}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function paragraph(text) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${C.ink};">${text}</p>`
}

export function getAgoraAuthEmailTemplates() {
  const magicLinkBody =
    paragraph(
      'Use the code below to sign in to your Agora account. It expires shortly and can only be used once.'
    ) +
    paragraph(`This code was sent to <strong style="color:${C.ink};">{{ .Email }}</strong>.`)

  const confirmBody =
    paragraph(`Welcome to ${PRODUCT_NAME}. ${TAGLINE}.`) +
    paragraph('Confirm your email address to finish setting up your account.')

  const recoveryBody =
    paragraph('We received a request to reset the password for your Agora account.') +
    paragraph('Use the button below to choose a new password. This link expires shortly.')

  const inviteBody =
    paragraph('You have been invited to Agora.') +
    paragraph('Accept the invitation to create your account and get started.')

  const emailChangeBody =
    paragraph('Confirm your new email address to keep your Agora account secure.') +
    paragraph('New address: <strong>{{ .NewEmail }}</strong>')

  const reauthBody = paragraph('Enter the code below to verify your identity and continue.')

  const securityBody = (detail) =>
    paragraph(detail) +
    paragraph('If this was not you, sign in and review your account settings immediately.')

  return {
    mailer_subjects_magic_link: 'Your Agora sign-in code',
    mailer_templates_magic_link_content: layout({
      preheader: 'Your Agora sign-in code',
      title: 'Your sign-in code',
      body: magicLinkBody,
      token: '{{ .Token }}',
      footerNote:
        'Never share this code. If you did not request it, you can safely ignore this email.',
    }),

    mailer_subjects_confirmation: 'Confirm your Agora account',
    mailer_templates_confirmation_content: layout({
      preheader: 'Confirm your Agora account',
      title: 'Confirm your email',
      body: confirmBody,
      ctaLabel: 'Confirm email',
      ctaHref: '{{ .ConfirmationURL }}',
    }),

    mailer_subjects_recovery: 'Reset your Agora password',
    mailer_templates_recovery_content: layout({
      preheader: 'Reset your Agora password',
      title: 'Reset password',
      body: recoveryBody,
      ctaLabel: 'Reset password',
      ctaHref: '{{ .ConfirmationURL }}',
    }),

    mailer_subjects_invite: 'You are invited to Agora',
    mailer_templates_invite_content: layout({
      preheader: 'You are invited to Agora',
      title: 'You are invited',
      body: inviteBody,
      ctaLabel: 'Accept invitation',
      ctaHref: '{{ .ConfirmationURL }}',
    }),

    mailer_subjects_email_change: 'Confirm your new Agora email',
    mailer_templates_email_change_content: layout({
      preheader: 'Confirm your new email on Agora',
      title: 'Confirm new email',
      body: emailChangeBody,
      ctaLabel: 'Confirm new email',
      ctaHref: '{{ .ConfirmationURL }}',
    }),

    mailer_subjects_reauthentication: 'Your Agora verification code',
    mailer_templates_reauthentication_content: layout({
      preheader: 'Your Agora verification code',
      title: 'Verification code',
      body: reauthBody,
      token: '{{ .Token }}',
    }),

    mailer_subjects_password_changed_notification: 'Your Agora password was changed',
    mailer_templates_password_changed_notification_content: layout({
      preheader: 'Your Agora password was changed',
      title: 'Password changed',
      body: securityBody('The password for your Agora account was recently changed.'),
    }),

    mailer_subjects_email_changed_notification: 'Your Agora email was changed',
    mailer_templates_email_changed_notification_content: layout({
      preheader: 'Your Agora email was changed',
      title: 'Email changed',
      body: securityBody(
        'Your account email was changed from {{ .OldEmail }} to {{ .Email }}.'
      ),
    }),
  }
}

export function getTemplateManifest() {
  const t = getAgoraAuthEmailTemplates()
  return [
    { id: 'magic_link', subjectKey: 'mailer_subjects_magic_link', contentKey: 'mailer_templates_magic_link_content', label: 'Magic link / OTP (login codes)' },
    { id: 'confirmation', subjectKey: 'mailer_subjects_confirmation', contentKey: 'mailer_templates_confirmation_content', label: 'Confirm sign up' },
    { id: 'recovery', subjectKey: 'mailer_subjects_recovery', contentKey: 'mailer_templates_recovery_content', label: 'Reset password' },
    { id: 'invite', subjectKey: 'mailer_subjects_invite', contentKey: 'mailer_templates_invite_content', label: 'Invite user' },
    { id: 'email_change', subjectKey: 'mailer_subjects_email_change', contentKey: 'mailer_templates_email_change_content', label: 'Change email' },
    { id: 'reauthentication', subjectKey: 'mailer_subjects_reauthentication', contentKey: 'mailer_templates_reauthentication_content', label: 'Reauthentication' },
  ].map((m) => ({
    ...m,
    subject: t[m.subjectKey],
    html: t[m.contentKey],
  }))
}
