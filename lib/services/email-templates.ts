/**
 * Templates d'e-mails (Resend) – style aligné sur Clerk (teal, structure simple).
 * Utilisés pour les mails Clerk en "Read only" qu'on envoie nous-mêmes en français.
 */

const TEAL = '#0d9488'

export type AccountLockedVariables = {
  locked_date: string
  failed_attempts: string
  lockout_duration: string
  app_name: string
}

/**
 * HTML du mail "Compte verrouillé" en français (même structure que le template Clerk).
 */
export function getAccountLockedEmailHtml(vars: AccountLockedVariables): string {
  const { locked_date, failed_attempts, lockout_duration, app_name } = vars

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte verrouillé</title>
</head>
<body style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 24px 24px; border-bottom: 1px solid #e5e7eb;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827;">Compte verrouillé</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
          Votre compte a été verrouillé. Pour protéger votre sécurité, l'accès a été temporairement restreint.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 20px; font-size: 14px; color: #4b5563;">
          <tr><td style="padding: 4px 0;"><strong>Verrouillé le</strong> ${escapeHtml(locked_date)}</td></tr>
          <tr><td style="padding: 4px 0;"><strong>Tentatives échouées</strong> ${escapeHtml(failed_attempts)}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #111827;">Que se passe-t-il ensuite ?</p>
        <p style="margin: 0 0 16px; font-size: 15px; color: #374151;">
          Votre compte sera automatiquement déverrouillé après ${escapeHtml(lockout_duration)}. Vous pouvez également contacter un administrateur pour déverrouiller votre compte immédiatement.
        </p>
        <p style="margin: 0; font-size: 15px; color: #374151;">
          Si vous ne vous attendiez pas à cela, veuillez contacter un administrateur immédiatement, car votre compte pourrait être compromis.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 24px 32px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Ceci est une notification de sécurité automatisée de ${escapeHtml(app_name)}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c)
}
