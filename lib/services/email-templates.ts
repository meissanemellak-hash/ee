/**
 * Templates d'e-mails (Resend) – structure calquée sur les templates Clerk.
 * Utilisés pour les mails Clerk en "Read only" qu'on envoie nous-mêmes en français.
 */

export type AccountLockedVariables = {
  locked_date: string
  failed_attempts: string
  lockout_duration: string
  app_name: string
}

/**
 * HTML du mail "Compte verrouillé" en français – structure identique au template Clerk
 * (padding, grilles, couleurs #000 / #757575 / #dddddd, typo 12px/14px).
 */
export function getAccountLockedEmailHtml(vars: AccountLockedVariables): string {
  const { locked_date, failed_attempts, lockout_duration, app_name } = vars

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre compte a été verrouillé - ${escapeHtml(app_name)}</title>
  <!-- preheader (aperçu dans la liste des mails) -->
  <div style="display: none; max-height: 0; overflow: hidden;">Votre compte a été verrouillé</div>
</head>
<body style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; padding: 48px 24px 48px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header : logo / nom app (Clerk utilise {{> app_logo}}, on affiche le nom faute de logo dans le webhook) -->
    <tr>
      <td style="padding: 16px 24px;">
        <span style="font-size: 24px; color: #000000;">${escapeHtml(app_name)}</span>
      </td>
    </tr>
    <!-- Titre + date à droite -->
    <tr>
      <td style="padding: 24px 24px 0px 24px; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="50%" style="vertical-align: top;">
              <span style="font-weight: bold; color: #000000;">Compte verrouillé</span>
            </td>
            <td width="50%" style="vertical-align: top; text-align: right;">
              <span style="font-size: 14px; color: #757575;">${escapeHtml(locked_date)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding: 24px;"><div style="height: 1px; background-color: #dddddd;"></div></td></tr>
    <!-- Intro -->
    <tr>
      <td style="padding: 0px 24px;">
        <p style="margin: 0; font-size: 14px; color: #000000; line-height: 21px;">
          Votre compte a été verrouillé. Pour protéger votre sécurité, l'accès a été temporairement restreint.
        </p>
      </td>
    </tr>
    <tr><td style="padding: 24px;"><div style="height: 1px; background-color: #dddddd;"></div></td></tr>
    <!-- Détails : Verrouillé le | date, Tentatives échouées | nombre -->
    <tr>
      <td style="padding: 0px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td width="40%" style="padding: 0px 0px 12px 0px;"><span style="font-size: 12px; color: #757575;">Verrouillé le</span></td>
            <td width="60%" style="padding: 0px 0px 12px 0px; text-align: right;"><span style="font-size: 12px; color: #000000;">${escapeHtml(locked_date)}</span></td>
          </tr>
          <tr>
            <td width="40%" style="padding: 0px 0px 12px 0px;"><span style="font-size: 12px; color: #757575;">Tentatives échouées</span></td>
            <td width="60%" style="padding: 0px 0px 12px 0px; text-align: right;"><span style="font-size: 12px; color: #000000;">${escapeHtml(failed_attempts)}</span></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding: 24px;"><div style="height: 1px; background-color: #dddddd;"></div></td></tr>
    <!-- Que se passe-t-il ensuite ? -->
    <tr>
      <td style="padding: 0px 24px 24px 24px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #000000; font-weight: bold;">Que se passe-t-il ensuite ?</p>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #000000; line-height: 21px;">
          Votre compte sera automatiquement déverrouillé après ${escapeHtml(lockout_duration)}. Vous pouvez également contacter un administrateur pour déverrouiller votre compte immédiatement.
        </p>
        <p style="margin: 0; font-size: 14px; color: #000000; line-height: 21px;">
          Si vous ne vous attendiez pas à cela, veuillez contacter un administrateur immédiatement, car votre compte pourrait être compromis.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 0px 24px 48px 24px;">
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #757575;">
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
